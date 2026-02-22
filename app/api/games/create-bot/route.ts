import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { GameResult } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'
import { processGameResult } from '@/lib/ranking'

/**
 * Creates a bot game and processes the result
 * Bot games use a special "Bot" user that should exist in the database
 */
export async function POST(request: NextRequest) {
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

    const { result, botName } = await request.json()

    if (!result || !['win', 'loss', 'draw'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be win, loss, or draw' },
        { status: 400 }
      )
    }

    // Find or create a bot user
    // For simplicity, we'll use a single "Bot" user for all bot games
    let botUser = await prisma.user.findUnique({
      where: { email: 'bot@system.local' },
    })

    if (!botUser) {
      // Create bot user if it doesn't exist
      botUser = await prisma.user.create({
        data: {
          name: 'Bot',
          email: 'bot@system.local',
          password: 'bot', // Not used for authentication
          rank: 'Beginner',
        },
      })
    }

    // Determine game result from user's perspective
    let gameResult: GameResult = GameResult.DRAW
    const userIsWhite = true // User always plays white in bot games

    if (result === 'win') {
      gameResult = userIsWhite ? GameResult.WHITE_WIN : GameResult.BLACK_WIN
    } else if (result === 'loss') {
      gameResult = userIsWhite ? GameResult.BLACK_WIN : GameResult.WHITE_WIN
    }

    // Create the game
    const game = await prisma.game.create({
      data: {
        whitePlayerId: userIsWhite ? user.id : botUser.id,
        blackPlayerId: userIsWhite ? botUser.id : user.id,
        result: gameResult,
        isOnline: false, // Bot games are not online games
      },
    })

    // Process the game result to update rankings
    try {
      await processGameResult(game.id)
    } catch (error) {
      console.error('Error processing bot game result:', error)
      // Don't fail the request if ranking processing fails
    }

    return NextResponse.json({
      success: true,
      gameId: game.id,
      message: `Game saved: ${result} against ${botName || 'Bot'}`,
    })
  } catch (error) {
    console.error('Error creating bot game:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create bot game' },
      { status: 500 }
    )
  }
}
