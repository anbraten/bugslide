import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';

// (re-)generate the personal api token of the current user (used for the MCP server)
export default defineEventHandler(async (event) => {
  const db = await useDb(event);
  const user = await requireUser(event);

  const token = `bsu_${randomBytes(24).toString('hex')}`;

  await db.update(usersTable).set({ apiToken: token }).where(eq(usersTable.id, user.id));

  return { token };
});
