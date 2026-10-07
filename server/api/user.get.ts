export default defineEventHandler(async (event) => {
  const user = await getUser(event);
  if (!user) {
    return { user: null };
  }

  // never expose the api token with the session user
  const { apiToken: _, ...publicUser } = user;
  return { user: publicUser };
});
