import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function runMigration() {
  const migrationPath = path.join(
    process.cwd(),
    'prisma',
    'migrations',
    '20260221180000_update_regions_to_longitude_latitude',
    'migration.sql'
  )

  const sql = fs.readFileSync(migrationPath, 'utf-8')
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement)
      console.log('✓ Executed:', statement.substring(0, 50) + '...')
    } catch (error) {
      console.error('✗ Error executing:', statement.substring(0, 50))
      console.error(error)
    }
  }

  console.log('Migration completed!')
}

runMigration()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
