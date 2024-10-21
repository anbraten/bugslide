import { eq } from 'drizzle-orm/sql';

export default defineEventHandler(async (event) => {
  const db = await useDb(event);
  const user = await requireUser(event);

  const projects = await db
    .select()
    .from(projectsTable)
    .leftJoin(userProjectsTable, eq(userProjectsTable.userId, user.id))
    .where(eq(projectsTable.id, userProjectsTable.projectId));

  return projects.map((p) => p.projects);
});
