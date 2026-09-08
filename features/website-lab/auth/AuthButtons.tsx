'use client'

import { signIn, signOut } from 'next-auth/react'
import { useState } from 'react'

export function AuthButton({ logout = false, label }: { logout?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  async function handleClick() {
    setBusy(true)
    setFailed(false)
    try {
      if (logout) await signOut({ callbackUrl: '/login' })
      else await signIn('google', { callbackUrl: '/apps/website-lab' })
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }
  return <>
    <button onClick={handleClick} disabled={busy} style={{ padding: '12px 22px', borderRadius: 12, border: '1px solid #365e50', background: '#fff', color: '#244737', cursor: busy ? 'wait' : 'pointer', font: 'inherit' }}>
      {busy ? 'Please wait…' : logout ? 'Sign out' : label ?? 'Sign in with Google'}
    </button>
    {failed && <p role="alert">Couldn’t connect. Please try again.</p>}
  </>
}
