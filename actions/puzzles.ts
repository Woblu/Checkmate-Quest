'use server'

import { prisma } from '@/lib/prisma'

/**
 * Get a random puzzle by theme and rating range
 * @param theme - The puzzle theme to search for (e.g., 'mate', 'fork', 'pin')
 * @param minRating - Minimum puzzle rating
 * @param maxRating - Maximum puzzle rating
 */
export async function getRandomPuzzleByTheme(
  theme: string,
  minRating: number = 800,
  maxRating: number = 1500
): Promise<{ success: boolean; puzzle?: any; error?: string }> {
  try {
    // Find puzzles that contain the theme in their themes string and are within rating range
    const puzzles = await prisma.puzzle.findMany({
      where: {
        themes: {
          contains: theme,
        },
        rating: {
          gte: minRating,
          lte: maxRating,
        },
      },
    })

    if (puzzles.length === 0) {
      return {
        success: false,
        error: `No puzzles found for theme: ${theme} with rating ${minRating}-${maxRating}`,
      }
    }

    // Select a random puzzle
    const randomIndex = Math.floor(Math.random() * puzzles.length)
    const puzzle = puzzles[randomIndex]

    return {
      success: true,
      puzzle,
    }
  } catch (error) {
    console.error('Error getting random puzzle by theme:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get puzzle',
    }
  }
}
