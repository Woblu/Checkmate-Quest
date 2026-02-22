import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/campaign/tournament-node/[nodeId]
 * Returns a tournament node by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { nodeId: string } }
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

    // Fetch the tournament node
    const node = await prisma.tournamentNode.findUnique({
      where: { id: params.nodeId },
      include: {
        region: true,
      },
    })

    if (!node) {
      return NextResponse.json(
        { error: 'Tournament node not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ node })
  } catch (error) {
    console.error('Error fetching tournament node:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament node' },
      { status: 500 }
    )
  }
}
