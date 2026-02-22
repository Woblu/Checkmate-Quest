import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/campaign/regions
 * Returns all regions with user's tour progress
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

    // Fetch all regions ordered by their order field
    const regions = await prisma.region.findMany({
      orderBy: {
        order: 'asc',
      },
    })

    // Fetch user's tour progress
    const userProgress = await prisma.userTourProgress.findUnique({
      where: {
        userId: user.id,
      },
    })

    // If no progress exists, create it with the first region
    let currentRegionId = userProgress?.currentRegionId
    if (!userProgress && regions.length > 0) {
      const newProgress = await prisma.userTourProgress.create({
        data: {
          userId: user.id,
          currentRegionId: regions[0].id,
        },
      })
      currentRegionId = newProgress.currentRegionId
    }

    // Determine which regions are locked/unlocked
    const regionsWithStatus = regions.map((region, index) => {
      const isCurrent = region.id === currentRegionId
      
      // First region is always unlocked
      if (index === 0) {
        return {
          ...region,
          isCurrent,
          isLocked: false,
        }
      }
      
      // A region is locked if the previous region hasn't been completed
      // Previous region is completed if currentRegionId is at or past this region
      const currentRegionIndex = currentRegionId 
        ? regions.findIndex(r => r.id === currentRegionId)
        : -1
      
      const isLocked = currentRegionIndex < index

      return {
        ...region,
        isCurrent,
        isLocked,
      }
    })

    return NextResponse.json({ 
      regions: regionsWithStatus,
      currentRegionId,
      highestRoundCleared: userProgress?.highestRoundCleared || null,
    })
  } catch (error) {
    console.error('Error fetching regions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Failed to fetch regions',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
