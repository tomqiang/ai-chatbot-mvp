import { redirect } from 'next/navigation'

// Redirect /create to /apps/story to maintain canonical entry point
export default function CreatePage() {
  redirect('/apps/story')
}
