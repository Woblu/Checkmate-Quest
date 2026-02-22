import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🛍️ Seeding cosmetic shop items...')

  const cosmetics = [
    // Boards
    {
      name: 'Classic Mahogany',
      type: 'BOARD' as const,
      price: 50,
      asset_url: '/assets/boards/mahogany.jpg',
    },
    {
      name: 'Ker-Plunky Deep Sea',
      type: 'BOARD' as const,
      price: 200,
      asset_url: '/assets/boards/underwater.jpg',
    },
    {
      name: 'Neon Cyber',
      type: 'BOARD' as const,
      price: 150,
      asset_url: '/assets/boards/neon.jpg',
    },
    // Pieces
    {
      name: 'Staunton Standard',
      type: 'PIECES' as const,
      price: 0,
      asset_url: 'standard',
    },
    {
      name: 'Amethyst Crystal',
      type: 'PIECES' as const,
      price: 300,
      asset_url: 'amethyst',
    },
    {
      name: '8-Bit Pixel',
      type: 'PIECES' as const,
      price: 100,
      asset_url: 'pixel',
    },
  ]

  console.log(`Creating ${cosmetics.length} cosmetic items...`)
  
  for (const cosmeticData of cosmetics) {
    try {
      // Check if cosmetic already exists by name
      const existing = await prisma.cosmetic.findFirst({
        where: {
          name: cosmeticData.name,
        },
      })

      if (existing) {
        console.log(`  ⏭️  Skipped: ${cosmeticData.name} (already exists)`)
      } else {
        const cosmetic = await prisma.cosmetic.create({
          data: cosmeticData,
        })
        console.log(`  ✓ Created: ${cosmetic.name} (${cosmetic.type}) - ${cosmetic.price} pawns`)
      }
    } catch (error) {
      console.error(`  ✗ Error creating ${cosmeticData.name}:`, error)
    }
  }

  console.log('\n✅ Shop seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding shop data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
