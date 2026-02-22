import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Support custom email/password login: check auth-token cookie first
    const token = request.cookies.get('auth-token')?.value
    if (token) {
      const tokenUser = await getUserFromToken(token)
      if (tokenUser) {
        const { password: _p, ...safeUser } = tokenUser
        return NextResponse.json({
          user: safeUser,
        })
      }
    }

    // Otherwise use Clerk session
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch full user from database using clerk_id (Clerk userId)
    let user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: {
        id: true,
        clerk_id: true,
        name: true,
        email: true,
        rank: true,
        currentPoints: true,
        gamesPlayedInCycle: true,
        totalGames: true,
        pieceSet: true,
        boardStyle: true,
        pawns: true,
      },
    })

    // If user doesn't exist in database, create them
    if (!user) {
      try {
        // Get user info from Clerk
        const { currentUser } = await import('@clerk/nextjs/server')
        const clerkUser = await currentUser()
        
        if (!clerkUser) {
          return NextResponse.json(
            { error: 'Clerk user not found' },
            { status: 404 }
          )
        }

        const userEmail = clerkUser.emailAddresses[0]?.emailAddress || `${userId}@temp.com`
        const userName = clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'User'

        // Create user in database (Clerk user: set clerk_id)
        user = await prisma.user.create({
          data: {
            clerk_id: userId,
            name: userName,
            email: userEmail,
            rank: 'Beginner',
            currentPoints: 0,
            gamesPlayedInCycle: 0,
            totalGames: 0,
            pieceSet: 'caliente',
            boardStyle: 'canvas2',
            pawns: 0,
          },
          select: {
            id: true,
            clerk_id: true,
            name: true,
            email: true,
            rank: true,
            currentPoints: true,
            gamesPlayedInCycle: true,
            totalGames: true,
            pieceSet: true,
            boardStyle: true,
            pawns: true,
          },
        })
      } catch (createError: any) {
        console.error('Error creating user:', createError)
        
        // If creation fails, try to fetch by clerk_id (maybe it was created in another request)
        user = await prisma.user.findUnique({
          where: { clerk_id: userId },
          select: {
            id: true,
            clerk_id: true,
            name: true,
            email: true,
            rank: true,
            currentPoints: true,
            gamesPlayedInCycle: true,
            totalGames: true,
            pieceSet: true,
            boardStyle: true,
            pawns: true,
          },
        })
        
        // If still no user, return error (don't throw to avoid 500)
        if (!user) {
          return NextResponse.json(
            { 
              error: 'Failed to create or find user',
              details: createError?.message || 'Unknown error'
            },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        id: user.id,
      },
    })
  } catch (error) {
    console.error('Error getting user:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
