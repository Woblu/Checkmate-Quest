import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateRegions() {
  console.log('Updating region coordinates...')

  const updates = [
    { order: 1, longitude: -88.0817, latitude: 41.5250 }, // Joliet
    { order: 2, longitude: -74.0060, latitude: 40.7128 }, // New York
    { order: 3, longitude: -0.1276, latitude: 51.5074 }, // London
    { order: 4, longitude: 2.3522, latitude: 48.8566 }, // Paris
    { order: 5, longitude: 37.6173, latitude: 55.7558 }, // Moscow
    { order: 6, longitude: 116.4074, latitude: 39.9042 }, // Beijing
    { order: 7, longitude: 139.6503, latitude: 35.6762 }, // Tokyo
    { order: 8, longitude: 151.2093, latitude: -33.8688 }, // Sydney
  ]

  // First, add the columns if they don't exist (as nullable)
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "regions" 
      ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
    `)
    console.log('✓ Added longitude and latitude columns')
  } catch (error) {
    console.log('Columns may already exist, continuing...')
  }

  // Update each region
  for (const update of updates) {
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "regions" 
        SET "longitude" = ${update.longitude}, "latitude" = ${update.latitude}
        WHERE "order" = ${update.order};
      `)
      console.log(`✓ Updated ${update.order}: ${update.longitude}, ${update.latitude}`)
    } catch (error) {
      console.error(`✗ Error updating region ${update.order}:`, error)
    }
  }

  // Make columns NOT NULL
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "regions" 
      ALTER COLUMN "longitude" SET NOT NULL,
      ALTER COLUMN "latitude" SET NOT NULL;
    `)
    console.log('✓ Made columns required')
  } catch (error) {
    console.error('✗ Error making columns required:', error)
  }

  // Drop old columns
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "regions" 
      DROP COLUMN IF EXISTS "map_x",
      DROP COLUMN IF EXISTS "map_y";
    `)
    console.log('✓ Dropped old map_x and map_y columns')
  } catch (error) {
    console.error('✗ Error dropping columns:', error)
  }

  console.log('✅ Region coordinates updated!')
}

updateRegions()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
