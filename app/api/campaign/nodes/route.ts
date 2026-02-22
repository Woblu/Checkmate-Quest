import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/campaign/nodes
 * Returns all campaign nodes with user's progress
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

    // Fetch all campaign nodes ordered by their order field
    const nodes = await prisma.campaignNode.findMany({
      orderBy: {
        order: 'asc',
      },
    })

    // Fetch user's progress for all nodes
    const userProgress = await prisma.userCampaignProgress.findMany({
      where: {
        userId: user.id,
      },
      select: {
        nodeId: true,
        starsEarned: true,
        completedAt: true,
      },
    })

    // Create a map of nodeId -> progress for quick lookup
    const progressMap = new Map(
      userProgress.map((p) => [p.nodeId, p])
    )

    // Combine nodes with user progress
    const nodesWithProgress = nodes.map((node, index) => {
      const progress = progressMap.get(node.id)
      const isCompleted = !!progress?.completedAt
      const isLocked = index > 0 && !progressMap.get(nodes[index - 1]?.id)?.completedAt

      return {
        ...node,
        starsEarned: progress?.starsEarned || 0,
        isCompleted,
        isLocked,
        isCurrent: !isLocked && !isCompleted,
      }
    })

    return NextResponse.json({ nodes: nodesWithProgress })
  } catch (error) {
    console.error('Error fetching campaign nodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign nodes' },
      { status: 500 }
    )
  }
}
