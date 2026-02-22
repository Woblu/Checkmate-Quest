import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCosmetic() {
  const cosmetic = await prisma.cosmetic.findFirst({
    where: {
      name: {
        contains: 'Reillycraig',
      },
    },
  })

  if (cosmetic) {
    console.log('Found Reillycraig cosmetic:')
    console.log(JSON.stringify(cosmetic, null, 2))
  } else {
    console.log('Reillycraig cosmetic not found in database')
    
    // Check all piece cosmetics
    const allPieces = await prisma.cosmetic.findMany({
      where: { type: 'PIECES' },
    })
    console.log('\nAll piece cosmetics:')
    allPieces.forEach(c => {
      console.log(`- ${c.name}: asset_url = "${c.asset_url}"`)
    })
  }
}

checkCosmetic()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
