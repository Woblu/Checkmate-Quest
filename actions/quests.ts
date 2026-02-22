'use server'

import { prisma } from '@/lib/prisma'
import { awardPawns } from '@/actions/economy'

/**
 * Assign daily quests to a user if they don't have any for today
 */
export async function assignDailyQuests(userId: string): Promise<{
  success: boolean
  assigned?: number
  error?: string
}> {
  try {
    // Get today's date at midnight (start of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Check if user already has quests assigned today
    const existingQuests = await prisma.userQuestProgress.findMany({
      where: {
        userId,
        dateAssigned: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // If they already have quests for today, return early
    if (existingQuests.length > 0) {
      return { success: true, assigned: 0 }
    }

    // Get all available quests
    const allQuests = await prisma.quest.findMany()

    if (allQuests.length === 0) {
      return { success: false, error: 'No quests available' }
    }

    // Randomly select 3 quests (or fewer if there aren't 3 available)
    const questsToAssign = allQuests
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, allQuests.length))

    // Create UserQuestProgress records
    await prisma.userQuestProgress.createMany({
      data: questsToAssign.map((quest) => ({
        userId,
        questId: quest.id,
        progress: 0,
        completed: false,
        dateAssigned: today,
      })),
    })

    return { success: true, assigned: questsToAssign.length }
  } catch (error) {
    console.error('Error assigning daily quests:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign quests',
    }
  }
}

/**
 * Evaluate quests based on an event
 * @param userId - The user's clerk_id
 * @param eventType - The type of event ('GAME_WON', 'PUZZLE_SOLVED', 'BOT_DEFEATED')
 * @param count - The number of times the event occurred (default: 1)
 */
export async function evaluateQuests(
  userId: string,
  eventType: 'GAME_WON' | 'PUZZLE_SOLVED' | 'BOT_DEFEATED',
  count: number = 1
): Promise<{ success: boolean; completedQuests: number; error?: string }> {
  try {
    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get user's active (incomplete) quests for today
    const activeQuests = await prisma.userQuestProgress.findMany({
      where: {
        userId,
        completed: false,
        dateAssigned: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        quest: true,
      },
    })

    if (activeQuests.length === 0) {
      return { success: true, completedQuests: 0 }
    }

    // Map event types to quest title patterns
    const eventPatterns: Record<string, string[]> = {
      GAME_WON: ['win', 'game', 'match', 'victory'],
      PUZZLE_SOLVED: ['puzzle', 'solve', 'tactic'],
      BOT_DEFEATED: ['bot', 'defeat', 'beat', 'challenge'],
    }

    const patterns = eventPatterns[eventType] || []
    let completedCount = 0

    // Process each active quest
    for (const userQuest of activeQuests) {
      const questTitle = userQuest.quest.title.toLowerCase()

      // Check if this quest matches the event type
      const matchesEvent = patterns.some((pattern) =>
        questTitle.includes(pattern)
      )

      if (!matchesEvent) {
        continue
      }

      // Increment progress
      const newProgress = userQuest.progress + count
      const isCompleted = newProgress >= userQuest.quest.requirementCount

      // Update the quest progress
      await prisma.userQuestProgress.update({
        where: { id: userQuest.id },
        data: {
          progress: newProgress,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      })

      // If completed, award pawns
      if (isCompleted) {
        try {
          await awardPawns(
            userId,
            userQuest.quest.pawnReward,
            `quest_completed:${userQuest.quest.title}`
          )
          completedCount++
        } catch (error) {
          console.error(
            `Error awarding pawns for quest ${userQuest.quest.id}:`,
            error
          )
        }
      }
    }

    return { success: true, completedQuests: completedCount }
  } catch (error) {
    console.error('Error evaluating quests:', error)
    return {
      success: false,
      completedQuests: 0,
      error: error instanceof Error ? error.message : 'Failed to evaluate quests',
    }
  }
}
