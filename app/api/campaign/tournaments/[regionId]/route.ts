import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/campaign/tournaments/[regionId]
 * Returns all tournament nodes for a region with user's progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { regionId: string } }
) {
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

    // Fetch all tournament nodes for this region
    const nodes = await prisma.tournamentNode.findMany({
      where: {
        regionId: params.regionId,
      },
      orderBy: {
        roundName: 'asc', // This will need to be ordered properly (Quarter-Final, Semi-Final, Final)
      },
    })

    // Fetch user's tour progress
    const userProgress = await prisma.userTourProgress.findUnique({
      where: {
        userId: user.id,
      },
    })

    // Determine which nodes are playable
    const roundOrder = ['Quarter-Final', 'Semi-Final', 'Final']
    const nodesWithStatus = nodes.map((node, index) => {
      const roundIndex = roundOrder.indexOf(node.roundName)
      const highestRoundIndex = userProgress?.highestRoundCleared 
        ? roundOrder.indexOf(userProgress.highestRoundCleared)
        : -1

      const isCompleted = highestRoundIndex >= roundIndex
      const isPlayable = highestRoundIndex === roundIndex - 1 || (highestRoundIndex === -1 && roundIndex === 0)
      const isLocked = highestRoundIndex < roundIndex - 1

      return {
        ...node,
        isCompleted,
        isPlayable,
        isLocked,
      }
    })

    return NextResponse.json({ 
      nodes: nodesWithStatus,
      userProgress,
    })
  } catch (error) {
    console.error('Error fetching tournament nodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament nodes' },
      { status: 500 }
    )
  }
}
