import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import type { Breadcrumb, Event, StackFrame } from '@sentry/core';
import { and, count, desc, eq, like, or } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { z } from 'zod';
import { resolveSourceFrames } from '#server/utils/source-map';

// MCP endpoint (streamable HTTP, stateless) to give AI agents access to the errors of a project.
// Authenticated with the project API token: `Authorization: Bearer <token>`
export default defineEventHandler(async (event) => {
  const project = await requireProjectByToken(event);

  const server = createMcpServer(event, project);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(toWebRequest(event));
  } finally {
    await server.close();
  }
});

function json(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorUrl(event: H3Event, project: Project, errorId: number) {
  return `${useRuntimeConfig(event).public.host}/projects/${project.id}/errors/${errorId}`;
}

function createMcpServer(event: H3Event, project: Project) {
  const db = useDb(event);

  const server = new McpServer(
    { name: 'bugslide', version: '1.0.0' },
    {
      instructions: `Access to the errors captured by Bugslide (a Sentry-compatible error tracker) for the project "${project.name}". Use list_errors to find errors and get_error to inspect the stack trace, breadcrumbs and context of an error.`,
    },
  );

  server.registerTool(
    'list_errors',
    {
      title: 'List errors',
      description: 'List the errors (issues) of the project. Each error groups all events with the same type and message.',
      inputSchema: {
        state: z.enum(['open', 'resolved', 'ignored']).optional().describe('Filter by state. Defaults to all states.'),
        sort: z.enum(['lastSeen', 'firstSeen', 'events']).optional().describe('Sort order. Defaults to lastSeen.'),
        search: z.string().optional().describe('Search in error type and message'),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional().describe('Defaults to 25'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ state, sort, search, page = 1, limit = 25 }) => {
      const orderBy = (() => {
        if (sort === 'firstSeen') return desc(errorsTable.createdAt);
        if (sort === 'events') return desc(errorsTable.events);
        return desc(errorsTable.lastOccurrence);
      })();

      const where = and(
        eq(errorsTable.projectId, project.id),
        state ? eq(errorsTable.state, state) : undefined,
        search ? or(like(errorsTable.title, `%${search}%`), like(errorsTable.value, `%${search}%`)) : undefined,
      );

      const [items, [totalRow]] = await Promise.all([
        db
          .select()
          .from(errorsTable)
          .where(where)
          .orderBy(orderBy)
          .limit(limit)
          .offset((page - 1) * limit),
        db.select({ total: count() }).from(errorsTable).where(where),
      ]);
      const total = totalRow?.total ?? 0;

      return json({
        items: items.map((error) => ({
          id: error.id,
          type: error.title,
          message: error.value,
          state: error.state,
          events: error.events,
          firstSeen: error.createdAt,
          lastSeen: error.lastOccurrence,
          url: errorUrl(event, project, error.id),
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    },
  );

  server.registerTool(
    'get_error',
    {
      title: 'Get error',
      description:
        'Get the details of an error including the stack trace (resolved with source maps if available), breadcrumbs, release, tags and context of one of its events.',
      inputSchema: {
        errorId: z.number().int().describe('Id of the error'),
        eventId: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe('Number of the event (1 = first occurrence). Defaults to the latest event.'),
        allFrames: z
          .boolean()
          .optional()
          .describe('Include stack frames of dependencies (node_modules). Defaults to false.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ errorId, eventId, allFrames }) => {
      const error = await getFirstElement(
        db
          .select()
          .from(errorsTable)
          .where(and(eq(errorsTable.projectId, project.id), eq(errorsTable.id, errorId))),
      );
      if (!error) {
        return { isError: true, content: [{ type: 'text', text: `Error ${errorId} not found` }] };
      }

      const errorEvent = await getFirstElement(
        db
          .select()
          .from(errorEventsTable)
          .where(
            and(eq(errorEventsTable.error, error.id), eventId ? eq(errorEventsTable.eventId, eventId) : undefined),
          )
          .orderBy(desc(errorEventsTable.eventId))
          .limit(1),
      );

      const sentryEvent: Event | undefined = errorEvent?.event ?? undefined;

      let frames: StackFrame[] = [];
      if (errorEvent?.stacktrace?.frames) {
        const debugIds = new Map<string, string>();
        sentryEvent?.debug_meta?.images?.forEach((image) => {
          if (image.type === 'sourcemap') {
            debugIds.set(image.code_file, image.debug_id);
          }
        });

        const rawFrames = errorEvent.stacktrace.frames.map((frame) => ({
          ...frame,
          debug_id: debugIds.get(frame.filename ?? ''),
        }));

        // same release as used by the UI
        const resolved = await resolveSourceFrames(event, project.id.toString(), 'latest', rawFrames);
        frames = resolved
          .filter((frame): frame is StackFrame => !!frame)
          .filter((frame) => allFrames || !frame.filename?.includes('node_modules/'))
          .toReversed() // most recent call first
          .map(formatFrame);
      }

      return json({
        id: error.id,
        type: error.title,
        message: error.value,
        state: error.state,
        events: error.events,
        firstSeen: error.createdAt,
        lastSeen: error.lastOccurrence,
        url: errorUrl(event, project, error.id),
        event: errorEvent
          ? {
              eventId: errorEvent.eventId,
              createdAt: errorEvent.createdAt,
              release: errorEvent.release,
              environment: sentryEvent?.environment,
              platform: sentryEvent?.platform,
              level: sentryEvent?.level,
              transaction: sentryEvent?.transaction,
              request: sentryEvent?.request,
              user: sentryEvent?.user,
              tags: sentryEvent?.tags,
              contexts: sentryEvent?.contexts,
              extra: sentryEvent?.extra,
              stacktrace: frames,
              breadcrumbs: (sentryEvent?.breadcrumbs ?? []).slice(-30).map(formatBreadcrumb),
            }
          : null,
      });
    },
  );

  server.registerTool(
    'update_error_state',
    {
      title: 'Update error state',
      description: 'Resolve, ignore or reopen an error.',
      inputSchema: {
        errorId: z.number().int().describe('Id of the error'),
        state: z.enum(['open', 'resolved', 'ignored']),
      },
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    async ({ errorId, state }) => {
      const error = await db
        .update(errorsTable)
        .set({ state, updatedAt: new Date() })
        .where(and(eq(errorsTable.projectId, project.id), eq(errorsTable.id, errorId)))
        .returning()
        .get();

      if (!error) {
        return { isError: true, content: [{ type: 'text', text: `Error ${errorId} not found` }] };
      }

      return json({ id: error.id, state: error.state });
    },
  );

  return server;
}

function formatFrame(frame: StackFrame) {
  const code = [...(frame.pre_context ?? []), frame.context_line, ...(frame.post_context ?? [])]
    .filter((line) => line !== undefined)
    .map((line, i) => {
      const lineno = (frame.lineno ?? 0) - (frame.pre_context?.length ?? 0) + i;
      return `${lineno === frame.lineno ? '>' : ' '} ${lineno} | ${line}`;
    });

  return {
    location: `${frame.filename ?? '?'}:${frame.lineno ?? '?'}:${frame.colno ?? '?'}`,
    function: frame.function,
    inApp: frame.in_app,
    sourceMapped: !!frame.vars?.resolved,
    code: code.length > 0 ? code.join('\n') : undefined,
  };
}

function formatBreadcrumb(breadcrumb: Breadcrumb) {
  return {
    timestamp: breadcrumb.timestamp ? new Date(breadcrumb.timestamp * 1000).toISOString() : undefined,
    category: breadcrumb.category,
    level: breadcrumb.level,
    message: breadcrumb.message,
    data: breadcrumb.data,
  };
}
