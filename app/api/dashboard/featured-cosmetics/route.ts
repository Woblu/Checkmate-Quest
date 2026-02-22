import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/dashboard/featured-cosmetics
 * Returns 2 random unowned cosmetics
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

    // Get user's owned cosmetics
    const ownedCosmetics = await prisma.userCosmetic.findMany({
      where: { userId: user.id },
      select: { cosmeticId: true },
    })

    const ownedIds = ownedCosmetics.map((uc) => uc.cosmeticId)

    // Get all cosmetics not owned by user
    const allCosmetics = await prisma.cosmetic.findMany({
      where: {
        id: {
          notIn: ownedIds.length > 0 ? ownedIds : [],
        },
      },
    })

    // Shuffle and take 2
    const shuffled = allCosmetics.sort(() => 0.5 - Math.random())
    const featured = shuffled.slice(0, 2)

    return NextResponse.json({ cosmetics: featured })
  } catch (error) {
    console.error('Error fetching featured cosmetics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured cosmetics' },
      { status: 500 }
    )
  }
}
