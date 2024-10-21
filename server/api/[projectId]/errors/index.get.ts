import { eq } from 'drizzle-orm';
import { requireProject } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const db = await useDb();

  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const errors = await db.select().from(errorsTable).where(eq(errorsTable.projectId, project.id));

  return errors;
});
