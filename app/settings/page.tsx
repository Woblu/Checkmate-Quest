import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { clerk_id: userId },
    include: {
      cosmetics: {
        include: { cosmetic: true },
      },
    },
  })

  if (!user) redirect('/login')

  const ownedPieceSets = Array.from(
    new Set(
      user.cosmetics
        .filter((uc) => uc.cosmetic.type === 'PIECES')
        .map((uc) => uc.cosmetic.asset_url.toLowerCase())
    )
  )

  const ownedBoardStyles = Array.from(
    new Set(
      user.cosmetics
        .filter((uc) => uc.cosmetic.type === 'BOARD')
        .map((uc) => {
          const url = uc.cosmetic.asset_url || ''
          const file = url.split('/').pop() || ''
          return file.split('.')[0] // e.g. '/Boards/green.png' -> 'green'
        })
    )
  )

  const initialUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    pieceSet: user.pieceSet,
    boardStyle: user.boardStyle,
  }

  return (
    <SettingsClient
      initialUser={initialUser}
      ownedPieceSets={ownedPieceSets}
      ownedBoardStyles={ownedBoardStyles}
    />
  )
}
