'use server'

import { clearAllData as performClear } from '@/app/lib/admin/clearAllData'

export async function clearAllDataAction(confirmText: string) {
  // Validate confirmText
  if (confirmText !== 'DELETE') {
    return {
      ok: false,
      deleted: 0,
      tookMs: 0,
      error: 'Invalid confirmation text',
    }
  }

  // Check admin secret (server-side only)
  const adminSecret = process.env.ADMIN_CLEAR_SECRET
  if (!adminSecret) {
    // In development, allow without secret if not set
    if (process.env.NODE_ENV === 'production') {
      return {
        ok: false,
        deleted: 0,
        tookMs: 0,
        error: 'Admin clear secret not configured',
      }
    }
  }

  // Perform the clear operation
  return await performClear()
}
