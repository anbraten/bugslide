import { Event, EventItem, Exception } from '@sentry/types';
import { parseEnvelope, forEachEnvelopeItem } from '@sentry/utils';
import { and, eq } from 'drizzle-orm';

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

  const db = await useDb();
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

  const events: Event[] = [];
  forEachEnvelopeItem(envelope, (item, itemType) => {
    if (itemType === 'event') {
      const event = Array.isArray(item) ? (item as EventItem)[1] : undefined;
      if (event) {
        events.push(event);
      } else {
        console.log('Unsupported event item', item);
      }
    } else {
      // console.log('Unsupported item type', itemType, item);
    }
  });

  for await (const event of events) {
    if (event.exception) {
      for await (const exception of event.exception.values ?? []) {
        try {
          await saveError(project, exception, event);
        } catch (error) {
          console.error('Failed to store error:', error);
        }
      }
    }

    if (event.logentry) {
      try {
        await db.insert(logsTable).values({
          projectId: project.id,
          createdAt: new Date(),
          level: event.level || 'info',
          message: event.logentry?.message || 'Unknown Log',
          metadata: event.extra ? JSON.stringify(event.extra) : null,
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

async function saveError(project: any, exception: Exception, event: Event) {
  const db = await useDb();

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

  if (error) {
    // update error
    await db
      .update(errorsTable)
      .set({
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
        // stacktrace: exception.stacktrace ? JSON.stringify(exception.stacktrace) : null,
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
    event: event,
  });
}
