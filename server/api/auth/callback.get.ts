export default defineEventHandler(async (event) => {
  const db = await useDb(event);
  const config = useRuntimeConfig(event);
  const session = await useAuthSession(event);

  const { code } = getQuery(event);
  if (!code) {
    throw new Error('No code provided');
  }

  const response = await $fetch<{
    access_token?: string;
    error?: string;
    scope?: string;
    token_type?: string;
  }>('https://github.com/login/oauth/access_token', {
    method: 'POST',
    body: {
      client_id: config.auth.clientId,
      client_secret: config.auth.clientSecret,
      code,
      grant_type: 'authorization_code',
    },
    headers: {
      'User-Agent': 'Nitro',
    },
  });
  if (response.error) {
    console.error(response.error);
    throw new Error('Error getting access token');
  }

  const githubUser = await $fetch<{
    avatar_url: string;
    email: string;
    id: number;
    login: string;
    name: string;
  }>('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${response.access_token}`,
      'User-Agent': 'Nitro',
    },
  });

  let email: string | null = githubUser.email;
  // if no public email, check the private ones
  if (!email) {
    const emails = await $fetch<
      {
        email: string;
        primary: boolean;
      }[]
    >('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${response.access_token}`,
        'User-Agent': 'Nitro',
      },
    });
    const primaryEmail = emails.find((email: any) => email.primary);
    email = primaryEmail?.email ?? null;
  }

  if (!email) {
    throw new Error('No email found');
  }

  const user = {
    name: githubUser.name || githubUser.login,
    avatarUrl: githubUser.avatar_url,
    email,
    remoteUserId: githubUser.id.toString(),
  };

  const users = await db
    .insert(usersTable)
    .values({
      email: user.email,
      avatarUrl: user.avatarUrl,
      name: user.name,
    })
    .onConflictDoUpdate({
      target: [usersTable.email],
      set: {
        avatarUrl: user.avatarUrl,
        name: user.name,
      },
    })
    .returning();

  if (users?.length !== 1) {
    throw new Error('Failed to create user');
  }

  await session.update({
    userId: users[0].id,
  });

  return sendRedirect(event, '/');
});
