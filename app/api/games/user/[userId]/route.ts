import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: authUserId } = await auth()
    if (!authUserId) return new NextResponse('Unauthorized', { status: 401 })

    const games = await prisma.game.findMany({
      where: {
        AND: [
          {
            OR: [
              { whitePlayerId: params.userId },
              { blackPlayerId: params.userId },
            ],
          },
          { result: null }, // Only active games
        ],
      },
      include: {
        whitePlayer: {
          select: { id: true, name: true },
        },
        blackPlayer: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 10,
    })

    return NextResponse.json({ games })
  } catch (error) {
    console.error('Error fetching user games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}
