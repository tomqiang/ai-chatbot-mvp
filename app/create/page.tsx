import { redirect } from 'next/navigation'

// Redirect /create to root (/) to maintain canonical entry point
export default function CreatePage() {
  redirect('/')
}
