import { randomBytes } from 'crypto';

export default defineEventHandler(async (event) => {
  const stateId = randomBytes(64).toString('hex');

  const config = useRuntimeConfig(event);

  const clientId = config.auth.clientId;
  const scopes = ['read:user', 'user:email'];
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=public_repo&state=${stateId}&scope=${scopes.join(
    '%20',
  )}`;
  return sendRedirect(event, redirectUrl);
});
