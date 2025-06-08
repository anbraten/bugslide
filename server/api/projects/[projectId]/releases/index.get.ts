import { desc, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const db = await useDb(event);

  const releases = await db
    .select()
    .from(releasesTable)
    .where(eq(releasesTable.projectId, project.id))
    .orderBy(desc(releasesTable.createdAt));

  return releases;
});
