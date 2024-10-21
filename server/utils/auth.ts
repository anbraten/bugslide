import type { H3Event } from 'h3';
import { and, eq } from 'drizzle-orm';

export type AuthSession = {
  userId: number;
};

export async function useAuthSession(event: H3Event) {
  const sessionConfig = useRuntimeConfig().auth || {};
  return await useSession<AuthSession>(event, sessionConfig);
}

export async function getUser(event: H3Event): Promise<User | undefined> {
  const session = await useAuthSession(event);
  if (!session.data?.userId) {
    return undefined;
  }

  const db = await useDb();
  return await db.select().from(usersTable).where(eq(usersTable.id, session.data.userId)).get();
}

export async function requireUser(event: H3Event): Promise<User> {
  const user = await getUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  return user;
}

export async function requireAccessToProject(user: User, projectId: number) {
  const db = await useDb();

  const userRepo = await db
    .select()
    .from(userProjectsTable)
    .where(and(eq(userProjectsTable.userId, user.id), eq(userProjectsTable.projectId, projectId)))
    .get();

  if (!userRepo) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access to project denied',
    });
  }

  const repo = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, Number(projectId)))
    .get();

  if (!repo) {
    throw createError({
      statusCode: 404,
      message: 'Project not found',
    });
  }

  return repo;
}
