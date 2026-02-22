import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/user/cosmetics
 * Returns all cosmetics owned by the authenticated user
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

    const userCosmetics = await prisma.userCosmetic.findMany({
      where: {
        userId: user.id,
      },
      include: {
        cosmetic: true,
      },
      orderBy: {
        purchasedAt: 'desc',
      },
    })

    return NextResponse.json({ cosmetics: userCosmetics })
  } catch (error) {
    console.error('Error fetching user cosmetics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user cosmetics' },
      { status: 500 }
    )
  }
}
