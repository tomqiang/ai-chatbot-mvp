'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// Redirect old /story/[storyId] routes to new /apps/story/[storyId] routes
export default function LegacyStoryRedirect() {
  const params = useParams()
  const router = useRouter()
  const storyId = params.storyId as string

  useEffect(() => {
    if (storyId) {
      router.replace(`/apps/story/${storyId}`)
    } else {
      router.replace('/apps/story')
    }
  }, [storyId, router])

  return (
    <div className="chronicle-app">
      <main className="chronicle-main">
        <div className="chronicle-content">
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            正在跳转...
          </div>
        </div>
      </main>
    </div>
  )
}
