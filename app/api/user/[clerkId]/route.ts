import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { clerkId: string } }
) {
  try {
    const idOrClerkId = params.clerkId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { clerk_id: idOrClerkId },
          { id: idOrClerkId },
        ],
      },
      select: {
        id: true,
        clerk_id: true,
        name: true,
        email: true,
        rank: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
