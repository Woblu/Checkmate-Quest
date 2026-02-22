import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/dashboard/puzzle-theme
 * Returns a random puzzle theme for display
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get a random puzzle to extract theme
    const puzzle = await prisma.puzzle.findFirst({
      orderBy: {
        id: 'asc', // Simple way to get a puzzle
      },
    })

    if (!puzzle) {
      return NextResponse.json({
        theme: 'Tactics',
        description: 'Master your tactical skills',
      })
    }

    // Extract first theme from comma-separated themes
    const themes = puzzle.themes.split(',').map((t) => t.trim())
    const randomTheme = themes[Math.floor(Math.random() * themes.length)] || 'Tactics'

    const themeDescriptions: { [key: string]: string } = {
      fork: 'Master your Forks',
      pin: 'Perfect your Pins',
      skewer: 'Learn Skewers',
      discovered: 'Discover Attacks',
      backRank: 'Back Rank Tactics',
      deflection: 'Deflection Techniques',
      decoy: 'Decoy Strategies',
      clearance: 'Clearance Sacrifices',
    }

    return NextResponse.json({
      theme: randomTheme,
      description: themeDescriptions[randomTheme.toLowerCase()] || `Master ${randomTheme}`,
    })
  } catch (error) {
    console.error('Error fetching puzzle theme:', error)
    return NextResponse.json(
      { theme: 'Tactics', description: 'Master your tactical skills' },
      { status: 200 }
    )
  }
}
