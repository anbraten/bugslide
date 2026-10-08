import type { StackFrame, Stacktrace } from '@sentry/core';
import { and, eq } from 'drizzle-orm';
import { errorToMarkdown } from '#server/utils/error-markdown';
import { resolveSourceFrames } from '#server/utils/source-map';

// the error event as markdown, ready to be pasted into an AI assistant
export default defineEventHandler(async (event) => {
  const db = await useDb(event);
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const errorId = parseInt(getRouterParam(event, 'errorId') ?? '', 10);
  const eventId = parseInt(getRouterParam(event, 'eventId') ?? '', 10);
  if (Number.isNaN(errorId) || Number.isNaN(eventId)) {
    throw createError({ message: 'errorId and eventId are required', status: 400 });
  }

  const error = await getFirstElement(
    db
      .select()
      .from(errorsTable)
      .where(and(eq(errorsTable.projectId, project.id), eq(errorsTable.id, errorId))),
  );
  if (!error) {
    throw createError({ message: 'Error not found', status: 404 });
  }

  const errorEvent = await getFirstElement(
    db
      .select()
      .from(errorEventsTable)
      .where(and(eq(errorEventsTable.error, error.id), eq(errorEventsTable.eventId, eventId))),
  );
  if (!errorEvent) {
    throw createError({ message: 'Event not found', status: 404 });
  }

  const sentryEvent = errorEvent.event ?? undefined;
  const release = errorEvent.release ?? sentryEvent?.release ?? null;

  // same lookup as the stack trace in the UI: some SDKs attach the stack to the event or a thread instead of the exception
  const exception =
    sentryEvent?.exception?.values?.find((v) => v.type === error.title && (v.value ?? '') === (error.value ?? '')) ??
    sentryEvent?.exception?.values?.at(-1);
  let frames: StackFrame[] =
    [
      errorEvent.stacktrace,
      exception?.stacktrace,
      (sentryEvent as { stacktrace?: Stacktrace } | undefined)?.stacktrace,
      ...(sentryEvent?.threads?.values ?? [])
        .toSorted((a, b) => Number(!!b.crashed) - Number(!!a.crashed))
        .map((t) => t.stacktrace),
    ].find((st) => st?.frames?.length)?.frames ?? [];
  if (frames.length > 0) {
    const debugIds = new Map<string, string>();
    sentryEvent?.debug_meta?.images?.forEach((image) => {
      if (image.type === 'sourcemap') {
        debugIds.set(image.code_file, image.debug_id);
      }
    });

    const resolved = await resolveSourceFrames(
      event,
      project.id.toString(),
      release || 'latest',
      frames.map((frame) => ({ ...frame, debug_id: debugIds.get(frame.filename ?? '') })),
    );
    frames = resolved.filter((frame): frame is StackFrame => !!frame);
  }

  return {
    markdown: errorToMarkdown({
      error,
      url: `${useRuntimeConfig(event).public.host}/projects/${project.id}/errors/${error.id}`,
      eventId: errorEvent.eventId,
      release,
      sentryEvent,
      mechanism: exception?.mechanism,
      frames,
    }),
  };
});
