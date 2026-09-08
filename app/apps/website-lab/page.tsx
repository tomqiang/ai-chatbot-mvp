import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/features/website-lab/auth/options'
import { isAuthConfigured } from '@/features/website-lab/auth/access'
import { AuthButton } from '@/features/website-lab/auth/AuthButtons'
import WebsiteLab from '@/features/website-lab/components/WebsiteLab'

export const metadata = {
  title: 'Website Lab | Yier',
  description: 'Experiment with words, colors, and layouts in your own website playground.',
}

export const dynamic = 'force-dynamic'

export default async function WebsiteLabPage() {
  if (!isAuthConfigured()) redirect('/login')
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  return <>
    <div style={{ padding: '12px 24px', background: '#f5f3eb', display: 'flex', justifyContent: 'flex-end' }}><AuthButton logout /></div>
    <WebsiteLab />
  </>
}
