import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const db = await useDb(event);
  const user = await requireUser(event);
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const userProject = await db
    .select()
    .from(userProjectsTable)
    .where(and(eq(userProjectsTable.userId, user.id), eq(userProjectsTable.projectId, project.id)))
    .get();

  return { token: userProject?.token ?? null };
});
