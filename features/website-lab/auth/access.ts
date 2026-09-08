export function isAllowedEmail(email: unknown, allowlist = process.env.WEBSITE_LAB_ALLOWED_EMAILS): boolean {
  if (typeof email !== 'string' || !email.trim()) return false
  return (allowlist ?? '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean).includes(email.trim().toLowerCase())
}

export function isAllowedGoogleProfile(provider: unknown, profile: unknown): boolean {
  if (provider !== 'google' || !profile || typeof profile !== 'object') return false
  const identity = profile as { email?: unknown; email_verified?: unknown }
  return identity.email_verified === true && isAllowedEmail(identity.email)
}

export function isAuthConfigured(): boolean {
  return ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'WEBSITE_LAB_ALLOWED_EMAILS']
    .every(key => Boolean(process.env[key]?.trim()))
}
