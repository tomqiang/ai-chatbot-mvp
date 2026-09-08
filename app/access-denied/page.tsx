import Link from 'next/link'
import { AuthButton } from '@/features/website-lab/auth/AuthButtons'

export const metadata = { title: 'Access denied | Website Lab', robots: { index: false, follow: false } }

export default function AccessDeniedPage() {
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f3eb', padding: 24, color: '#244737' }}>
    <section style={{ maxWidth: 460, width: '100%', background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 12px 48px #24473712' }}>
      <p style={{ letterSpacing: 2, fontSize: 12 }}>WEBSITE LAB · INVITATION REQUIRED</p>
      <h1 style={{ fontSize: 32 }}>Google sign-in succeeded. Access isn’t granted.</h1>
      <p style={{ lineHeight: 1.7 }}>Google verified your account successfully. This account isn’t on Website Lab’s invitation list, so you can’t open this private page.</p>
      <p style={{ lineHeight: 1.7 }}>Try an invited Google account, or ask the site owner to add your email address.</p>
      <AuthButton label="Try another Google account" />
      <p style={{ marginTop: 28 }}><Link href="/">← Back to public apps</Link></p>
    </section>
  </main>
}
