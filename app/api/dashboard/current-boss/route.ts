import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/dashboard/current-boss
 * Returns the current region's next boss bot for the user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

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

    // Get user's tour progress
    const userProgress = await prisma.userTourProgress.findUnique({
      where: { userId: user.id },
      include: {
        currentRegion: {
          include: {
            tournaments: {
              orderBy: { roundName: 'asc' },
            },
          },
        },
      },
    })

    if (!userProgress || !userProgress.currentRegion) {
      // Get first region if no progress
      const firstRegion = await prisma.region.findFirst({
        orderBy: { order: 'asc' },
        include: {
          tournaments: {
            orderBy: { roundName: 'asc' },
          },
        },
      })

      if (!firstRegion || firstRegion.tournaments.length === 0) {
        return NextResponse.json({ boss: null })
      }

      return NextResponse.json({
        boss: {
          name: firstRegion.tournaments[0].botName,
          elo: firstRegion.tournaments[0].botElo,
          regionName: firstRegion.name,
        },
      })
    }

    // Find the next unplayed round
    const roundOrder = ['Quarter-Final', 'Semi-Final', 'Final']
    const highestRoundIndex = userProgress.highestRoundCleared
      ? roundOrder.indexOf(userProgress.highestRoundCleared)
      : -1

    const nextRoundIndex = highestRoundIndex + 1
    if (nextRoundIndex >= roundOrder.length) {
      // All rounds completed, get next region's first round
      const nextRegion = await prisma.region.findFirst({
        where: { order: { gt: userProgress.currentRegion.order } },
        orderBy: { order: 'asc' },
        include: {
          tournaments: {
            orderBy: { roundName: 'asc' },
          },
        },
      })

      if (nextRegion && nextRegion.tournaments.length > 0) {
        return NextResponse.json({
          boss: {
            name: nextRegion.tournaments[0].botName,
            elo: nextRegion.tournaments[0].botElo,
            regionName: nextRegion.name,
          },
        })
      }
      return NextResponse.json({ boss: null })
    }

    const nextRound = roundOrder[nextRoundIndex]
    const nextBoss = userProgress.currentRegion.tournaments.find(
      (t) => t.roundName === nextRound
    )

    if (!nextBoss) {
      return NextResponse.json({ boss: null })
    }

    return NextResponse.json({
      boss: {
        name: nextBoss.botName,
        elo: nextBoss.botElo,
        regionName: userProgress.currentRegion.name,
      },
    })
  } catch (error) {
    console.error('Error fetching current boss:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current boss' },
      { status: 500 }
    )
  }
}
