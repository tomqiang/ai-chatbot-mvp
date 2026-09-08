import NextAuth from 'next-auth'
import { authOptions } from '@/features/website-lab/auth/options'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
