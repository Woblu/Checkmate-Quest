import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Create an online game without a result (for real-time play)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const { whitePlayerId, blackPlayerId } = await request.json()

    if (!whitePlayerId || !blackPlayerId) {
      return NextResponse.json(
        { error: 'whitePlayerId and blackPlayerId are required' },
        { status: 400 }
      )
    }

    const game = await prisma.game.create({
      data: {
        whitePlayerId,
        blackPlayerId,
        result: null,
        isOnline: true,
      },
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error creating online game:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create game' },
      { status: 500 }
    )
  }
}
