'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { assignDailyQuests } from '@/actions/quests'

/**
 * Hook to assign daily quests when user logs in
 * Call this hook in components that require authentication
 */
export function useDailyQuests() {
  const { isSignedIn, user } = useUser()

  useEffect(() => {
    if (isSignedIn && user?.id) {
      // Assign daily quests (fire and forget - don't block UI)
      assignDailyQuests(user.id).catch((error) => {
        console.error('Error assigning daily quests:', error)
      })
    }
  }, [isSignedIn, user?.id])
}
