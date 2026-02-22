import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/user/equipped-cosmetics
 * Returns the user's currently equipped cosmetics
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
