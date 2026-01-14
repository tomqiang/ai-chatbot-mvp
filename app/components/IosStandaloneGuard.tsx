'use client'

import { useEffect } from 'react'

/**
 * iOS Standalone Guard
 * 
 * Detects when the app is running in iOS standalone mode (Add to Home Screen)
 * and adds the 'ios-standalone' class to the <html> element.
 * 
 * This is required for iOS PWA standalone mode with viewport-fit=cover to apply
 * safe-area padding only in standalone mode, not in normal Safari browser mode.
 */
export function IosStandaloneGuard() {
  useEffect(() => {
    // Check for standalone mode using both methods for iOS compatibility:
    // 1. Standard display-mode media query (works on modern iOS)
    // 2. navigator.standalone (legacy iOS Safari check)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) {
      document.documentElement.classList.add('ios-standalone')
    } else {
      document.documentElement.classList.remove('ios-standalone')
    }
  }, [])

  return null
}
