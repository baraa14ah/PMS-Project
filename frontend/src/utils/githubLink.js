/** Returns whether the user profile has a linked GitHub token. */
export function isGithubLinked(user, serverUser = null) {
  return !!(
    serverUser?.github_token ??
    user?.user?.github_token ??
    user?.github_token
  );
}

/** Builds the OAuth redirect URL for linking a GitHub account. */
export function buildGithubRedirectUrl(apiBaseUrl, userId, returnTo = "/dashboard") {
  const url = new URL(`${apiBaseUrl}/auth/github/redirect`);
  url.searchParams.set("user_id", String(userId));
  if (returnTo) url.searchParams.set("return_to", returnTo);
  return url.toString();
}
