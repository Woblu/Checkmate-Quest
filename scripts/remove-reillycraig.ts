import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeReillycraig() {
  console.log('🗑️  Removing Reillycraig Pieces...\n')

  // Find the Reillycraig cosmetic
  const cosmetic = await prisma.cosmetic.findFirst({
    where: {
      name: {
        contains: 'Reillycraig',
      },
    },
  })

  if (cosmetic) {
    console.log(`Found: ${cosmetic.name} (ID: ${cosmetic.id})`)
    
    // Remove all UserCosmetic entries for this cosmetic
    const userCosmetics = await prisma.userCosmetic.deleteMany({
      where: { cosmeticId: cosmetic.id },
    })
    console.log(`Removed ${userCosmetics.count} user ownership(s)`)
    
    // Remove the cosmetic
    await prisma.cosmetic.delete({
      where: { id: cosmetic.id },
    })
    console.log('✓ Reillycraig Pieces removed from database')
  } else {
    console.log('Reillycraig Pieces not found in database')
  }
}

removeReillycraig()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
