import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { Chess } from 'chess.js'

export async function POST(
  request: NextRequest,
  { params }: { params: { openingId: string } }
) {
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

    const { moves } = await request.json()
    const openingId = params.openingId

    if (!moves || !Array.isArray(moves)) {
      return NextResponse.json(
        { error: 'Moves array is required' },
        { status: 400 }
      )
    }

    // Replay the moves to find all nodes in the line by traversing the tree
    const chess = new Chess()
    const nodeIds: string[] = []
    let currentNodeId: string | null = null

    // First, find the root node (first move)
    if (moves.length > 0) {
      const firstMove = moves[0]
      const rootNode = await prisma.moveNode.findFirst({
        where: {
          openingId: openingId,
          parentNodeId: null,
          sanMove: firstMove,
        },
      })

      if (rootNode) {
        nodeIds.push(rootNode.id)
        currentNodeId = rootNode.id
        chess.move(firstMove)
      }
    }

    // Now traverse the tree following the moves
    for (let i = 1; i < moves.length; i++) {
      const moveSan = moves[i]
      
      try {
        // Find the child node that matches this move
        const childNode = await prisma.moveNode.findFirst({
          where: {
            openingId: openingId,
            parentNodeId: currentNodeId,
            sanMove: moveSan,
          },
          orderBy: {
            popularityScore: 'desc', // Prefer main line if multiple matches
          },
        })

        if (childNode) {
          nodeIds.push(childNode.id)
          currentNodeId = childNode.id
          
          // Make the move in chess to keep position in sync
          const move = chess.move(moveSan)
          if (!move) {
            console.warn(`Move ${moveSan} at index ${i} is invalid`)
          }
        } else {
          console.warn(`Could not find node for move ${moveSan} at index ${i}`)
          // Try to continue anyway
          const move = chess.move(moveSan)
          if (!move) {
            break
          }
        }
      } catch (error) {
        console.error(`Error processing move ${moveSan} at index ${i}:`, error)
        break
      }
    }

    // Mark all nodes as learned
    for (const nodeId of nodeIds) {
      await prisma.userProgress.upsert({
        where: {
          userId_moveNodeId: {
            userId: user.id,
            moveNodeId: nodeId,
          },
        },
        update: {
          isLearned: true,
        },
        create: {
          userId: user.id,
          moveNodeId: nodeId,
          isLearned: true,
        },
      })
    }

    console.log(`Marked ${nodeIds.length} nodes as learned for user ${user.id}`)

    return NextResponse.json({
      success: true,
      nodesLearned: nodeIds.length,
    })
  } catch (error) {
    console.error('Error marking line as learned:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark as learned' },
      { status: 500 }
    )
  }
}
