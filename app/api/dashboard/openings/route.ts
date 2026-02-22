import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/dashboard/openings
 * Returns openings that need review (spaced repetition)
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

    // Get openings with unlearned nodes
    const openings = await prisma.opening.findMany({
      include: {
        moveNodes: {
          include: {
            userProgress: {
              where: {
                userId: user.id,
                isLearned: false,
              },
            },
          },
        },
      },
    })

    // Filter to openings with unlearned nodes
    const openingsToReview = openings.filter(
      (opening) => opening.moveNodes.some((node) => node.userProgress.length === 0)
    )

    return NextResponse.json({
      count: openingsToReview.length,
      openings: openingsToReview.slice(0, 5).map((o) => ({
        id: o.id,
        name: o.name,
      })),
    })
  } catch (error) {
    console.error('Error fetching openings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch openings' },
      { status: 500 }
    )
  }
}
