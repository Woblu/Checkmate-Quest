import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getUserFromToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    let user = null
    const token = request.cookies.get('auth-token')?.value
    if (token) {
      user = await getUserFromToken(token)
    }
    if (!user) {
      const { userId } = await auth()
      if (userId) {
        user = await prisma.user.findUnique({
          where: { clerk_id: userId },
          select: { id: true },
        })
      }
    }
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { opponentId } = await request.json()

    if (!opponentId) {
      return NextResponse.json(
        { error: 'opponentId is required' },
        { status: 400 }
      )
    }

    if (opponentId === user.id) {
      return NextResponse.json(
        { error: 'Cannot play against yourself' },
        { status: 400 }
      )
    }

    // Check if opponent exists
    const opponent = await prisma.user.findUnique({
      where: { id: opponentId },
    })

    if (!opponent) {
      return NextResponse.json(
        { error: 'Opponent not found' },
        { status: 404 }
      )
    }

    // Randomly assign colors
    const isWhite = Math.random() > 0.5
    const whitePlayerId = isWhite ? user.id : opponentId
    const blackPlayerId = isWhite ? opponentId : user.id

    const game = await prisma.game.create({
      data: {
        whitePlayerId,
        blackPlayerId,
        result: null,
        isOnline: true,
      },
      include: {
        whitePlayer: {
          select: { id: true, name: true },
        },
        blackPlayer: {
          select: { id: true, name: true },
        },
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
