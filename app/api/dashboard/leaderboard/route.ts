import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/dashboard/leaderboard
 * Returns top 3 users by points/rank
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

    // Get top 3 users by currentPoints
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        rank: true,
        currentPoints: true,
      },
      orderBy: {
        currentPoints: 'desc',
      },
      take: 3,
    })

    return NextResponse.json({ users: topUsers })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
