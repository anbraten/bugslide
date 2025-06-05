import { parseEnvelope, forEachEnvelopeItem, Exception, EventItem, Event } from '@sentry/core';
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

async function saveError(event: H3Event, project: Project, exception: Exception, errorEvent: Event) {
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
    if (error.state === 'resolved') {
      // send error mail as the error will be reopened
      try {
        await sendErrorMail(event, project, error);
      } catch (error) {
        console.error('Failed to send error mail:', error);
      }
    }

    // update error
    await db
      .update(errorsTable)
      .set({
        state: 'open', // reopen error in case it was resolved
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

    // send new error mail
    try {
      await sendErrorMail(event, project, error);
    } catch (error) {
      console.error('Failed to send error mail:', error);
    }
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

export async function sendErrorMail(event: H3Event, project: Project, error: CaughtError) {
  const mail = useMail(event);
  if (!mail) {
    return;
  }

  const db = await useDb(event);

  const config = useRuntimeConfig(event);
  const url = `${config.publicHost}/projects/${project.id}/errors/${error.id}`;
  const text = `
An error just occurred in your project **${project.name}**:

${error.title}:

'''
${error.value}
'''

For more details, please visit: ${url}
  `.trim();

  // send error mail to all project members
  const users = await db
    .select()
    .from(usersTable)
    .leftJoin(userProjectsTable, eq(usersTable.id, userProjectsTable.userId))
    .where(eq(userProjectsTable.projectId, error.projectId));

  for await (const user of users) {
    if (!user.users.email) {
      continue;
    }

    console.log('Sending error mail to', user.users.email);

    await mail.sendMail({
      to: user.users.email,
      subject: `🔥 New Error in ${project.name}: ${error.title.slice(0, 50)}`,
      text,
      from: config.mail.from,
    });
  }
}
