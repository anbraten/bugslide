import { and, desc, eq } from 'drizzle-orm';
import { requireProject } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const db = await useDb(event);

  const { state } = getQuery<{ state?: 'open' | 'resolved' | 'ignored' }>(event);

  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const errors = await db
    .select()
    .from(errorsTable)
    .orderBy(desc(errorsTable.lastOccurrence))
    .where(and(eq(errorsTable.projectId, project.id), state ? eq(errorsTable.state, state) : undefined));

  return errors;
});
