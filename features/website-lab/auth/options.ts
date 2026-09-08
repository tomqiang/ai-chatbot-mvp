import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { isAllowedEmail, isAllowedGoogleProfile, isAuthConfigured } from './access'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    authorization: { params: { scope: 'openid email profile', prompt: 'select_account' } },
  })],
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async signIn({ account, profile }) {
      if (!isAuthConfigured() || account?.provider !== 'google') return false
      const identity = profile as { email?: string; email_verified?: boolean } | undefined
      if (identity?.email_verified !== true || !identity.email) return false
      // Google has verified identity; invitation controls access separately.
      if (!isAllowedEmail(identity.email)) return '/access-denied'
      return true
    },
    async jwt({ token, account, profile }) {
      if (account) token.websiteLabVerified = isAllowedGoogleProfile(account.provider, profile)
      return token
    },
    async session({ session, token }) {
      // Recheck on every request so removing an address also revokes existing access.
      if (!isAuthConfigured() || token.websiteLabVerified !== true || !isAllowedEmail(token.email)) {
        session.user = undefined
      }
      return session
    },
  },
}
