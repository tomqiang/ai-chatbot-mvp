# Website Lab Google login

Only `/apps/website-lab` requires login. Other apps remain public. NextAuth handles Google OAuth and encrypted session cookies; no database is required. The server checks Google's verified email against `WEBSITE_LAB_ALLOWED_EMAILS` before issuing access and rechecks the allowlist for existing sessions.

## Local setup

1. Open https://console.cloud.google.com/auth/overview and select or create a project.
2. Configure the app branding and audience. For a personal Gmail account choose External; while in Testing, add each invited account as a test user. Request only basic OpenID, email and profile information.
3. Create an OAuth client with application type **Web application**. Add this exact authorized redirect URI:
   `http://localhost:3000/api/auth/callback/google`
4. Add the client ID and secret to the ignored `.env.local` file using the variable names in `.env.example`. Never commit credentials or paste secrets into chat.
5. Set `WEBSITE_LAB_ALLOWED_EMAILS` to the invited Google email addresses, separated by commas. Set `NEXTAUTH_URL=http://localhost:3000`. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32` if one is not already configured.
6. Restart the dev server and visit `/apps/website-lab`. It should redirect to `/login`. An invited Google account can enter; another account should receive an access-denied message. Sign out and confirm the page redirects to login again.

## Vercel setup

Add the same environment variables in Vercel project settings, with a separate production session secret and `NEXTAUTH_URL` set to the actual HTTPS website origin. Add `https://YOUR_DOMAIN/api/auth/callback/google` to Google's authorized redirect URIs, replacing YOUR_DOMAIN with your actual domain. Redeploy for the variables and code to take effect. Each preview domain used for OAuth also needs its own matching configuration; localhost settings alone do not enable production login.

Removing an email from the allowlist and restarting/redeploying revokes access even for existing sessions. Never prefix these settings with NEXT_PUBLIC_. There is no built-in default allowed account.

## Scope

The route is protected on the server, including direct requests. Website Lab currently stores edits only in browser memory. Login does not make public repository source, public assets, other apps, or previously published content private. Any future private storage, API route, or server action must check the session and authorization before returning or changing data.

Google credentials are required to verify the complete live OAuth flow. Automated tests cover the allowlist and verified identity checks; local HTTP checks cover unauthenticated redirects.

## References

- User-provided guide (deprecated browser library): https://developers.google.com/identity/sign-in/web/sign-in
- Google OAuth provider: https://next-auth.js.org/providers/google
- Server session checks: https://next-auth.js.org/configuration/nextjs
