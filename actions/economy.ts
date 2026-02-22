'use server'

import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { cookies } from 'next/headers'

/**
 * Award pawns to a user
 * @param userId - The user ID
 * @param amount - The amount of pawns to award
 * @param reason - The reason for awarding (e.g., 'game_win', 'campaign_boss', 'puzzle_solved')
 */
export async function awardPawns(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, newBalance: 0, error: 'Amount must be positive' }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pawns: true },
    })

    if (!user) {
      return { success: false, newBalance: 0, error: 'User not found' }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        pawns: {
          increment: amount,
        },
      },
      select: { pawns: true },
    })

    // Log the transaction (optional - you could create a Transaction model later)
    console.log(`Awarded ${amount} pawns to user ${userId} for: ${reason}`)

    return {
      success: true,
      newBalance: updatedUser.pawns,
    }
  } catch (error) {
    console.error('Error awarding pawns:', error)
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Failed to award pawns',
    }
  }
}

/**
 * Purchase a cosmetic item
 * @param userId - The user ID
 * @param cosmeticId - The cosmetic ID to purchase
 */
export async function purchaseCosmetic(
  userId: string,
  cosmeticId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the cosmetic details
    const cosmetic = await prisma.cosmetic.findUnique({
      where: { id: cosmeticId },
    })

    if (!cosmetic) {
      return { success: false, error: 'Cosmetic not found' }
    }

    // Check if user already owns this cosmetic
    const existingOwnership = await prisma.userCosmetic.findUnique({
      where: {
        userId_cosmeticId: {
          userId,
          cosmeticId,
        },
      },
    })

    if (existingOwnership) {
      return { success: false, error: 'You already own this cosmetic' }
    }

    // Get user's current pawn balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pawns: true },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check if user has enough pawns
    if (user.pawns < cosmetic.price) {
      return {
        success: false,
        error: `Insufficient pawns. You need ${cosmetic.price} pawns, but you only have ${user.pawns}.`,
      }
    }

    // Perform the purchase in a transaction
    await prisma.$transaction(async (tx) => {
      // Deduct pawns from user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          pawns: {
            decrement: cosmetic.price,
          },
        },
      })

      // Create UserCosmetic record
      await tx.userCosmetic.create({
        data: {
          userId,
          cosmeticId,
          isEquipped: false,
        },
      })
    })

    return { success: true }
  } catch (error) {
    console.error('Error purchasing cosmetic:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to purchase cosmetic',
    }
  }
}

/**
 * Equip a cosmetic item
 * @param userId - The user ID
 * @param cosmeticId - The cosmetic ID to equip
 */
export async function equipCosmetic(
  userId: string,
  cosmeticId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user owns this cosmetic
    const userCosmetic = await prisma.userCosmetic.findUnique({
      where: {
        userId_cosmeticId: {
          userId,
          cosmeticId,
        },
      },
      include: {
        cosmetic: true,
      },
    })

    if (!userCosmetic) {
      return { success: false, error: 'You do not own this cosmetic' }
    }

    // Get all user's cosmetics of the same type
    const sameTypeCosmetics = await prisma.userCosmetic.findMany({
      where: {
        userId,
        cosmetic: {
          type: userCosmetic.cosmetic.type,
        },
      },
    })

    // Update all cosmetics of the same type to unequipped
    await prisma.userCosmetic.updateMany({
      where: {
        userId,
        cosmetic: {
          type: userCosmetic.cosmetic.type,
        },
      },
      data: {
        isEquipped: false,
      },
    })

    // Equip the selected cosmetic
    await prisma.userCosmetic.update({
      where: {
        userId_cosmeticId: {
          userId,
          cosmeticId,
        },
      },
      data: {
        isEquipped: true,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error equipping cosmetic:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to equip cosmetic',
    }
  }
}

/**
 * Get user's current pawn balance
 * @param userId - The user ID
 */
export async function getUserPawns(userId: string): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pawns: true },
    })

    return user?.pawns || 0
  } catch (error) {
    console.error('Error getting user pawns:', error)
    return 0
  }
}
