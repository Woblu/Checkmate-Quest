'use server'

import { prisma } from '@/lib/prisma'
import { awardPawns } from './economy'
import { evaluateQuests } from './quests'

/**
 * Process a tournament win
 * @param userId - The user ID
 * @param nodeId - The tournament node ID that was won
 * @returns Object with success status, region unlocked flag, and pawns awarded
 */
export async function processTournamentWin(
  userId: string,
  nodeId: string
): Promise<{ 
  success: boolean
  regionUnlocked: boolean
  pawnsAwarded: number
  error?: string 
}> {
  try {
    // Get the tournament node
    const node = await prisma.tournamentNode.findUnique({
      where: { id: nodeId },
      include: {
        region: true,
      },
    })

    if (!node) {
      return {
        success: false,
        regionUnlocked: false,
        pawnsAwarded: 0,
        error: 'Tournament node not found',
      }
    }

    // Get user's tour progress
    let userProgress = await prisma.userTourProgress.findUnique({
      where: { userId },
    })

    // Create progress if it doesn't exist
    if (!userProgress) {
      userProgress = await prisma.userTourProgress.create({
        data: {
          userId,
          currentRegionId: node.regionId,
        },
      })
    }

    // Award pawns for winning this match
    const pawnResult = await awardPawns(userId, node.pawnReward, `tournament_win_${nodeId}`)
    if (!pawnResult.success) {
      return {
        success: false,
        regionUnlocked: false,
        pawnsAwarded: 0,
        error: pawnResult.error,
      }
    }

    // Determine the round order
    const roundOrder = ['Quarter-Final', 'Semi-Final', 'Final']
    const currentRoundIndex = roundOrder.indexOf(node.roundName)
    const highestRoundIndex = userProgress.highestRoundCleared
      ? roundOrder.indexOf(userProgress.highestRoundCleared)
      : -1

    // Update highest round cleared if this is a new achievement
    let newHighestRound = userProgress.highestRoundCleared
    if (currentRoundIndex > highestRoundIndex) {
      newHighestRound = node.roundName
    }

    // Check if this was a Final round win
    const isFinalWin = node.roundName === 'Final'
    let regionUnlocked = false
    let regionBonusPawns = 0

    if (isFinalWin && userProgress.currentRegionId === node.regionId) {
      // Find the next region
      const allRegions = await prisma.region.findMany({
        orderBy: { order: 'asc' },
      })

      const currentRegionIndex = allRegions.findIndex(r => r.id === node.regionId)
      const nextRegion = allRegions[currentRegionIndex + 1]

      if (nextRegion) {
        // Unlock the next region
        await prisma.userTourProgress.update({
          where: { userId },
          data: {
            currentRegionId: nextRegion.id,
            highestRoundCleared: null, // Reset for new region
          },
        })

        // Award massive bonus for completing a region
        regionBonusPawns = 100 // Large bonus for completing a region
        const bonusResult = await awardPawns(
          userId,
          regionBonusPawns,
          `region_completion_${node.regionId}`
        )

        regionUnlocked = true
      } else {
        // This was the last region - tournament complete!
        await prisma.userTourProgress.update({
          where: { userId },
          data: {
            highestRoundCleared: 'Final',
          },
        })

        // Award even larger bonus for completing the entire tour
        regionBonusPawns = 500
        await awardPawns(userId, regionBonusPawns, 'world_tour_complete')
        regionUnlocked = false // No new region, but tour is complete
      }
    } else {
      // Update progress for non-final wins
      await prisma.userTourProgress.update({
        where: { userId },
        data: {
          highestRoundCleared: newHighestRound,
        },
      })
    }

    // Evaluate quests for bot defeat
    await evaluateQuests(userId, 'BOT_DEFEATED', 1).catch((error) => {
      console.error('Error evaluating quests for tournament win:', error)
    })

    return {
      success: true,
      regionUnlocked,
      pawnsAwarded: node.pawnReward + regionBonusPawns,
      unlocked_new_region: regionUnlocked, // Alias for frontend compatibility
    }
  } catch (error) {
    console.error('Error processing tournament win:', error)
    return {
      success: false,
      regionUnlocked: false,
      pawnsAwarded: 0,
      error: error instanceof Error ? error.message : 'Failed to process tournament win',
    }
  }
}
