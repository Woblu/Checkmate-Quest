import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Lichess chess openings TSV files
const OPENING_FILES = ['a', 'b', 'c', 'd', 'e']
const BASE_URL = 'https://raw.githubusercontent.com/lichess-org/chess-openings/master'

interface OpeningRow {
  eco: string
  name: string
  pgn: string // We'll parse it but only store eco and name
}

async function fetchOpeningsFile(letter: string): Promise<OpeningRow[]> {
  const url = `${BASE_URL}/${letter}.tsv`
  console.log(`  Fetching ${letter.toUpperCase()}.tsv...`)

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    
    // Skip header row and parse data
    const openings: OpeningRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const parts = line.split('\t')
      if (parts.length >= 3) {
        openings.push({
          eco: parts[0].trim(),
          name: parts[1].trim(),
          pgn: parts[2].trim(),
        })
      }
    }

    return openings
  } catch (error) {
    console.error(`  ✗ Error fetching ${letter}.tsv:`, error)
    return []
  }
}

async function seedOpenings() {
  console.log('📚 Seeding chess openings from Lichess ECO database...\n')

  let totalInserted = 0
  let totalSkipped = 0

  for (const letter of OPENING_FILES) {
    console.log(`\n📖 Processing volume ${letter.toUpperCase()}...`)
    
    const openings = await fetchOpeningsFile(letter)
    
    if (openings.length === 0) {
      console.log(`  ⚠️  No openings found in ${letter}.tsv`)
      continue
    }

    console.log(`  Found ${openings.length} openings`)

    // Map to Prisma Opening model format (only ecoCode and name)
    const openingData = openings.map(opening => ({
      ecoCode: opening.eco,
      name: opening.name,
    }))

    try {
      const result = await prisma.opening.createMany({
        data: openingData,
        skipDuplicates: true,
      })

      totalInserted += result.count
      console.log(`  ✓ Inserted ${result.count} openings from volume ${letter.toUpperCase()}`)
      
      // Calculate skipped (duplicates)
      const skipped = openings.length - result.count
      if (skipped > 0) {
        totalSkipped += skipped
        console.log(`  ⏭️  Skipped ${skipped} duplicate(s)`)
      }
    } catch (error) {
      console.error(`  ✗ Error inserting openings from ${letter}.tsv:`, error)
    }
  }

  console.log(`\n✅ Seeding complete!`)
  console.log(`   Total inserted: ${totalInserted}`)
  if (totalSkipped > 0) {
    console.log(`   Total skipped (duplicates): ${totalSkipped}`)
  }
}

seedOpenings()
  .catch((e) => {
    console.error('❌ Error seeding openings:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
