export default defineEventHandler(async (event) => {
  const db = await useDb();
  const projects = await db.select().from(projectsTable);
  return projects;
});
