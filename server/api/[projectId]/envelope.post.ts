import { Event, EventItem, Exception } from '@sentry/types';
import { parseEnvelope, forEachEnvelopeItem } from '@sentry/utils';
import { and, eq } from 'drizzle-orm';
import type { H3Event } from 'h3';

export default defineEventHandler(async (event) => {
  setHeader(event, 'Access-Control-Allow-Origin', '*');

  const projectId = getRouterParam(event, 'projectId');
  if (!projectId) {
    throw createError({
      message: 'projectId is required',
      status: 400,
    });
  }

  // const { sentry_key, sentry_client, sentry_version } = getQuery<{
  //   sentry_key?: string;
  //   sentry_version?: string;
  //   sentry_client?: string;
  // }>(event);

  const db = await useDb(event);
  const project = await getFirstElement(
    db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, parseInt(projectId, 10))),
  );
  if (!project) {
    throw createError({
      message: 'Project not found',
      status: 404,
    });
  }

  const sentryEnvelope = await readBody(event);

  const envelope = parseEnvelope(sentryEnvelope);

  const errorEvents: Event[] = [];
  forEachEnvelopeItem(envelope, (item, itemType) => {
    if (itemType === 'event') {
      const event = Array.isArray(item) ? (item as EventItem)[1] : undefined;
      if (event) {
        errorEvents.push(event);
      } else {
        console.log('Unsupported event item', item);
      }
    } else {
      // console.log('Unsupported item type', itemType, item);
    }
  });

  for await (const errorEvent of errorEvents) {
    if (errorEvent.exception) {
      for await (const exception of errorEvent.exception.values ?? []) {
        try {
          await saveError(event, project, exception, errorEvent);
        } catch (error) {
          console.error('Failed to store error:', error);
        }
      }
    }

    if (errorEvent.logentry) {
      try {
        await db.insert(logsTable).values({
          projectId: project.id,
          createdAt: new Date(),
          level: errorEvent.level || 'info',
          message: errorEvent.logentry?.message || 'Unknown Log',
          metadata: errorEvent.extra ? JSON.stringify(errorEvent.extra) : null,
        });
      } catch (error) {
        console.error('Failed to store log:', error);
      }
    }
  }

  return {
    ok: true,
  };
});

async function saveError(event: H3Event, project: any, exception: Exception, errorEvent: Event) {
  const db = await useDb(event);

  // check if error already exists
  let error = await getFirstElement(
    db
      .select()
      .from(errorsTable)
      .where(
        and(
          eq(errorsTable.projectId, project.id),
          eq(errorsTable.title, exception.type || 'Unknown Error'),
          eq(errorsTable.value, exception.value || ''),
        ),
      ),
  );

  if (error?.state === 'ignored') {
    return;
  }

  if (error) {
    // update error
    await db
      .update(errorsTable)
      .set({
        state: 'open', // reopen error in case it was closed
        events: error.events + 1,
        updatedAt: new Date(),
        lastOccurrence: new Date(),
      })
      .where(eq(errorsTable.id, error.id));
  } else {
    // create new error
    const res = await db
      .insert(errorsTable)
      .values({
        projectId: project.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        title: exception.type || 'Unknown Error',
        value: exception.value,
        state: 'open',
        events: 1,
        lastOccurrence: new Date(),
      })
      .returning();

    error = res?.[0];
  }

  if (!error) {
    throw new Error('Failed to create error');
  }

  await db.insert(errorEventsTable).values({
    error: error.id,
    eventId: error.events,
    createdAt: new Date(),
    stacktrace: exception.stacktrace,
    event: errorEvent,
  });
}
