'use client'

import { useEffect } from 'react'

/**
 * Unregister all service workers on load so that:
 * - Cached workbox (workbox-f1770938.js) stops running and no longer throws "Failed to execute 'match' on 'Cache'"
 * - Browser fetches fresh JS so socket URL and other fixes take effect instead of cached localhost bundle
 * Runs once per load; safe to run on every page.
 */
export default function UnregisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => {})
      })
    })
  }, [])

  return null
}
