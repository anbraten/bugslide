export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const clientId = config.auth.clientId;
  const scopes = ['read:user', 'user:email'];
  const redirectUri = getOAuthRedirectUri(event);
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=public_repo&scope=${scopes.join(
    '%20',
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  return sendRedirect(event, redirectUrl);
});
