import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/features/website-lab/auth/options'
import { isAuthConfigured } from '@/features/website-lab/auth/access'
import { AuthButton } from '@/features/website-lab/auth/AuthButtons'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sign in | Website Lab', robots: { index: false, follow: false } }

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const configured = isAuthConfigured()
  const session = configured ? await getServerSession(authOptions) : null
  if (session?.user) redirect('/apps/website-lab')
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f3eb', padding: 24, color: '#244737' }}>
    <section style={{ maxWidth: 440, width: '100%', background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 12px 48px #24473712' }}>
      <p style={{ letterSpacing: 2, fontSize: 12 }}>YOUR PRIVATE SPACE</p>
      <h1 style={{ fontSize: 32 }}>Website Lab</h1>
      <p style={{ lineHeight: 1.7 }}>Sign in with an invited Google account to open Website Lab.</p>
      {searchParams.error && <p role="alert">{searchParams.error === 'AccessDenied' ? 'This Google account does not have access. Please use an invited account.' : 'Sign-in didn’t finish. Please try again.'}</p>}
      {configured ? <AuthButton /> : <p role="status">Sign-in is not set up yet. Website Lab is locked until setup is complete.</p>}
      <p style={{ marginTop: 28 }}><Link href="/">← Back to apps</Link></p>
    </section>
  </main>
}
