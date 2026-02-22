import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const openings = await prisma.opening.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ openings })
  } catch (error) {
    console.error('Error fetching openings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch openings' },
      { status: 500 }
    )
  }
}
