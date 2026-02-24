import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const BOARDS_DIR = path.join(process.cwd(), 'public', 'Boards')
const PIECES_DIR = path.join(process.cwd(), 'public', 'Pieces')

const BOARD_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const DEFAULT_BOARD_ID = 'canvas2'   // free default board (filename without ext)
const DEFAULT_PIECE_SET = 'cardinal'  // free default piece set

function toTitleCase(str: string): string {
  return str
    .replace(/-/g, ' ')
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())
}

function friendlyBoardName(filename: string): string {
  const base = path.basename(filename, path.extname(filename))
  if (base === 'canvas2') return 'Canvas'
  if (base === 'wood2') return 'Wood 2'
  if (base === 'wood4') return 'Wood 4'
  if (base === 'purple-diag') return 'Purple Diagonal'
  return toTitleCase(base)
}

async function main() {
  console.log('🛍️ Seeding shop from public/Boards and public/Pieces...\n')

  // ─── Boards ─────────────────────────────────────────────────────────────
  const boardFiles: string[] = []
  if (fs.existsSync(BOARDS_DIR)) {
    const files = fs.readdirSync(BOARDS_DIR)
    for (const f of files) {
      const ext = path.extname(f).toLowerCase()
      if (BOARD_EXT.includes(ext)) boardFiles.push(f)
    }
    boardFiles.sort()
  }
  console.log(`Found ${boardFiles.length} board(s) in public/Boards`)

  // ─── Piece sets (folders that contain wQ.svg) ─────────────────────────────
  const pieceSets: string[] = []
  if (fs.existsSync(PIECES_DIR)) {
    const dirs = fs.readdirSync(PIECES_DIR, { withFileTypes: true })
    for (const d of dirs) {
      if (!d.isDirectory()) continue
      const wqPath = path.join(PIECES_DIR, d.name, 'wQ.svg')
      if (fs.existsSync(wqPath)) pieceSets.push(d.name)
    }
    pieceSets.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  }
  console.log(`Found ${pieceSets.length} piece set(s) in public/Pieces\n`)

  if (boardFiles.length === 0 && pieceSets.length === 0) {
    console.error('No boards or piece sets found. Check public/Boards and public/Pieces.')
    process.exit(1)
  }

  // ─── Reset shop: remove existing cosmetics (user_cosmetics cascade) ───────
  const deleted = await prisma.cosmetic.deleteMany({})
  console.log(`Cleared ${deleted.count} existing cosmetic(s).\n`)

  // ─── Create board cosmetics ──────────────────────────────────────────────
  for (const file of boardFiles) {
    const assetUrl = `/Boards/${file}`
    const base = path.basename(file, path.extname(file))
    const isDefault = base === DEFAULT_BOARD_ID
    const name = friendlyBoardName(file)
    const price = isDefault ? 0 : 50

    await prisma.cosmetic.create({
      data: {
        name,
        type: 'BOARD',
        price,
        asset_url: assetUrl,
      },
    })
    console.log(`  ✓ Board: ${name} — ${assetUrl} (${price} pawns)`)
  }

  // ─── Create piece set cosmetics ─────────────────────────────────────────
  console.log('')
  for (const folder of pieceSets) {
    const assetUrl = folder.toLowerCase()
    const isDefault = assetUrl === DEFAULT_PIECE_SET
    const name = toTitleCase(folder)
    const price = isDefault ? 0 : 50

    await prisma.cosmetic.create({
      data: {
        name,
        type: 'PIECES',
        price,
        asset_url: assetUrl,
      },
    })
    console.log(`  ✓ Pieces: ${name} — ${assetUrl} (${price} pawns)`)
  }

  console.log('\n✅ Shop seeding completed.')
  console.log(`   Boards: ${boardFiles.length}, Piece sets: ${pieceSets.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding shop:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
