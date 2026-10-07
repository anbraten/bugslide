export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  return { token: user.apiToken ?? null };
});
