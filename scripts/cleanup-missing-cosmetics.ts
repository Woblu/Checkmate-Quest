import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function cleanupMissingCosmetics() {
  console.log('🧹 Cleaning up cosmetics with missing assets...\n')

  // Get all cosmetics
  const allCosmetics = await prisma.cosmetic.findMany()

  let removedCount = 0

  for (const cosmetic of allCosmetics) {
    let shouldRemove = false
    let reason = ''

    if (cosmetic.type === 'PIECES') {
      // Check if piece set directory exists
      const pieceSetPath = path.join(process.cwd(), 'public', 'pieces', cosmetic.asset_url)
      if (!fs.existsSync(pieceSetPath)) {
        shouldRemove = true
        reason = `piece set directory "${cosmetic.asset_url}" not found`
      } else {
        // Also check if wQ.svg exists in the directory
        const queenPath = path.join(pieceSetPath, 'wQ.svg')
        if (!fs.existsSync(queenPath)) {
          shouldRemove = true
          reason = `wQ.svg not found in "${cosmetic.asset_url}"`
        }
      }
    } else if (cosmetic.type === 'BOARD') {
      // Check if board file exists
      const boardPath = path.join(process.cwd(), 'public', cosmetic.asset_url)
      if (!fs.existsSync(boardPath)) {
        shouldRemove = true
        reason = `board file "${cosmetic.asset_url}" not found`
      }
    }

    if (shouldRemove) {
      console.log(`  ✗ Removing: ${cosmetic.name} (${reason})`)
      
      // First, remove any UserCosmetic entries
      await prisma.userCosmetic.deleteMany({
        where: { cosmeticId: cosmetic.id },
      })
      
      // Then remove the cosmetic
      await prisma.cosmetic.delete({
        where: { id: cosmetic.id },
      })
      
      removedCount++
    }
  }

  console.log(`\n✅ Cleanup complete! Removed ${removedCount} cosmetic(s) with missing assets.`)
}

cleanupMissingCosmetics()
  .catch((e) => {
    console.error('❌ Error cleaning up cosmetics:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
