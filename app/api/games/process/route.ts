import { NextRequest, NextResponse } from 'next/server'
import { processGameResult } from '@/lib/ranking'

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      )
    }

    await processGameResult(gameId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing game result:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process game result' },
      { status: 500 }
    )
  }
}
