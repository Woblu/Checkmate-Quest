import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/**
 * GET /api/cosmetics
 * Returns all available cosmetics, optionally filtered by type
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // 'BOARD' or 'PIECES'

    const cosmetics = await prisma.cosmetic.findMany({
      where: type ? { type: type as 'BOARD' | 'PIECES' } : undefined,
      orderBy: {
        price: 'asc',
      },
    })

    return NextResponse.json({ cosmetics })
  } catch (error) {
    console.error('Error fetching cosmetics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cosmetics' },
      { status: 500 }
    )
  }
}
