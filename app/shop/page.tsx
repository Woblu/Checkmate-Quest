import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import CosmeticCard from '@/components/CosmeticCard'
import { GiCoins, GiChessPawn } from 'react-icons/gi'

async function getShopData() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    redirect('/login')
  }

  const user = await getUserFromToken(token)

  if (!user) {
    redirect('/login')
  }

  // Fetch user's pawns
  const userWithPawns = await prisma.user.findUnique({
    where: { id: user.id },
    select: { pawns: true },
  })

  // Fetch all cosmetics
  const cosmetics = await prisma.cosmetic.findMany({
    orderBy: [
      { type: 'asc' },
      { price: 'asc' },
    ],
  })

  // Fetch user's owned cosmetics
  const userCosmetics = await prisma.userCosmetic.findMany({
    where: { userId: user.id },
    select: {
      cosmeticId: true,
      isEquipped: true,
    },
  })

  // Create a map for quick lookup
  const ownershipMap = new Map(
    userCosmetics.map((uc) => [uc.cosmeticId, uc.isEquipped])
  )

  return {
    user: {
      id: user.id,
      pawns: userWithPawns?.pawns || 0,
    },
    cosmetics,
    ownershipMap,
  }
}

export default async function ShopPage() {
  const { user, cosmetics, ownershipMap } = await getShopData()

  const boardCosmetics = cosmetics.filter((c) => c.type === 'BOARD')
  const pieceCosmetics = cosmetics.filter((c) => c.type === 'PIECES')

  return (
    <div className="min-h-screen bg-chess-bg p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Pawns Balance */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-white">Shop</h1>
          <div className="flex items-center space-x-2 bg-chess-card px-6 py-3 rounded-full border border-chess-border">
            <GiCoins className="w-6 h-6 text-pawn-gold drop-shadow-md" />
            <span className="text-white font-semibold text-lg">{user.pawns}</span>
            <span className="text-slate-300 text-sm">pawns</span>
          </div>
        </div>

        {/* Chess Boards Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Chess Boards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {boardCosmetics.map((cosmetic) => {
              const isOwned = ownershipMap.has(cosmetic.id)
              const isEquipped = ownershipMap.get(cosmetic.id) || false

              return (
                <CosmeticCard
                  key={cosmetic.id}
                  cosmetic={cosmetic}
                  isOwned={isOwned}
                  isEquipped={isEquipped}
                  userPawns={user.pawns}
                  userId={user.id}
                />
              )
            })}
          </div>
        </div>

        {/* Piece Sets Section */}
        <div>
          <h2 className="text-2xl font-extrabold text-white mb-6">Piece Sets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pieceCosmetics.map((cosmetic) => {
              const isOwned = ownershipMap.has(cosmetic.id)
              const isEquipped = ownershipMap.get(cosmetic.id) || false

              return (
                <CosmeticCard
                  key={cosmetic.id}
                  cosmetic={cosmetic}
                  isOwned={isOwned}
                  isEquipped={isEquipped}
                  userPawns={user.pawns}
                  userId={user.id}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
