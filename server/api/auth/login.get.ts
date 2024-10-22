import { randomBytes } from 'crypto';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const clientId = config.auth.clientId;
  const scopes = ['read:user', 'user:email'];
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=public_repo&scope=${scopes.join(
    '%20',
  )}`;
  return sendRedirect(event, redirectUrl);
});
