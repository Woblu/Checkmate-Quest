import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GameResult } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const { whitePlayerId, blackPlayerId, result, isOnline } = await request.json()

    if (!whitePlayerId || !blackPlayerId) {
      return NextResponse.json(
        { error: 'whitePlayerId and blackPlayerId are required' },
        { status: 400 }
      )
    }

    // Validate result if provided
    if (result && !Object.values(GameResult).includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be WHITE_WIN, BLACK_WIN, or DRAW' },
        { status: 400 }
      )
    }

    const game = await prisma.game.create({
      data: {
        whitePlayerId,
        blackPlayerId,
        result: result ? (result as GameResult) : null,
        isOnline: isOnline ?? false,
      },
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create game' },
      { status: 500 }
    )
  }
}
