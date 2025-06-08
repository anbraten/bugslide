function randomString(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export default defineEventHandler(async (event) => {
  const db = await useDb(event);
  const user = await requireUser(event);

  const input = await readBody<{
    name: string;
  }>(event);

  const [project] = await db.insert(projectsTable).values({
    name: input.name,
    publicSecret: randomString(32),
   }).returning();

  await db.insert(userProjectsTable).values({
    userId: user.id,
    projectId: project.id,
  });

  return project;
});
