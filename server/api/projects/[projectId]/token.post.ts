import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

// (re-)generate the api token of the current user for the project
export default defineEventHandler(async (event) => {
  const db = await useDb(event);
  const user = await requireUser(event);
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const token = `bs_${randomBytes(24).toString('hex')}`;

  await db
    .update(userProjectsTable)
    .set({ token })
    .where(and(eq(userProjectsTable.userId, user.id), eq(userProjectsTable.projectId, project.id)));

  return { token };
});
