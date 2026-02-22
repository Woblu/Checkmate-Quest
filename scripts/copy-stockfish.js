const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, '..', 'public')
const stockfishDir = path.join(__dirname, '..', 'node_modules', 'stockfish')

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// Possible locations for stockfish files
const possiblePaths = [
  path.join(stockfishDir, 'src', 'stockfish.js'),
  path.join(stockfishDir, 'bin', 'stockfish.js'),
  path.join(stockfishDir, 'stockfish.js'),
  path.join(stockfishDir, 'src', 'stockfish.wasm'),
  path.join(stockfishDir, 'bin', 'stockfish.wasm'),
  path.join(stockfishDir, 'stockfish.wasm'),
]

// Files to copy
const filesToCopy = [
  { name: 'stockfish.js', wasm: false },
  { name: 'stockfish.wasm', wasm: true },
]

let foundFiles = 0

filesToCopy.forEach((file) => {
  // Try different possible locations
  let sourcePath = null
  
  // Check common locations
  const locations = [
    path.join(stockfishDir, 'src', file.name),
    path.join(stockfishDir, 'bin', file.name),
    path.join(stockfishDir, file.name),
  ]
  
  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      sourcePath = loc
      break
    }
  }
  
  // If not found, try to find it recursively (but limit depth to avoid performance issues)
  if (!sourcePath) {
    try {
      const findFile = (dir, depth = 0) => {
        if (depth > 3) return null // Limit search depth
        if (!fs.existsSync(dir)) return null
        
        const items = fs.readdirSync(dir)
        for (const item of items) {
          const fullPath = path.join(dir, item)
          const stat = fs.statSync(fullPath)
          
          if (stat.isFile() && item === file.name) {
            return fullPath
          } else if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            const found = findFile(fullPath, depth + 1)
            if (found) return found
          }
        }
        return null
      }
      
      sourcePath = findFile(stockfishDir)
    } catch (error) {
      // Ignore errors during search
    }
  }
  
  const destPath = path.join(publicDir, file.name)
  
  if (sourcePath && fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath)
    console.log(`✓ Copied ${file.name} to public/`)
    foundFiles++
  } else {
    console.warn(`⚠ Warning: ${file.name} not found in stockfish package`)
    console.warn(`  Searched in: node_modules/stockfish/src/, node_modules/stockfish/bin/, node_modules/stockfish/`)
  }
})

if (foundFiles === filesToCopy.length) {
  console.log('✓ All Stockfish files copied successfully!')
} else if (foundFiles > 0) {
  console.log(`⚠ Only ${foundFiles} of ${filesToCopy.length} files were found and copied.`)
  console.log('  You may need to download stockfish.js manually from:')
  console.log('  https://github.com/niklasf/stockfish.js/releases')
} else {
  console.log('⚠ No Stockfish files found in node_modules/stockfish')
  console.log('  The stockfish npm package may need to be built first, or')
  console.log('  you may need to download stockfish.js manually from:')
  console.log('  https://github.com/niklasf/stockfish.js/releases')
}
