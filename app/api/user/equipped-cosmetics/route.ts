import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/equipped-cosmetics
 * Returns the user's currently equipped cosmetics (Clerk auth only)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch user's equipped cosmetics
    const equippedCosmetics = await prisma.userCosmetic.findMany({
      where: {
        userId: user.id,
        isEquipped: true,
      },
      include: {
        cosmetic: true,
      },
    })

    // Find equipped board and pieces
    const equippedBoard = equippedCosmetics.find(
      (uc) => uc.cosmetic.type === 'BOARD'
    )
    const equippedPieces = equippedCosmetics.find(
      (uc) => uc.cosmetic.type === 'PIECES'
    )

    return NextResponse.json({
      boardUrl: equippedBoard?.cosmetic.asset_url || null,
      pieceSet: equippedPieces?.cosmetic.asset_url || null,
    })
  } catch (error) {
    console.error('Error fetching equipped cosmetics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipped cosmetics' },
      { status: 500 }
    )
  }
}
