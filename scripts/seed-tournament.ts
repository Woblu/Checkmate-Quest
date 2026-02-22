import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌍 Seeding World Chess Tour regions and tournaments...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('Clearing existing tournament data...')
  await prisma.tournamentNode.deleteMany({})
  await prisma.region.deleteMany({})
  await prisma.userTourProgress.deleteMany({})

  // Create Regions with longitude/latitude coordinates
  // Expanded tournament with more US tournaments and international ones
  const regions = [
    // US Regional Tournaments
    {
      name: 'Joliet Local',
      order: 1,
      longitude: -88.0817, // USA - Illinois
      latitude: 41.5250,
    },
    {
      name: 'Chicago Open',
      order: 2,
      longitude: -87.6298, // USA - Chicago
      latitude: 41.8781,
    },
    {
      name: 'New York Open',
      order: 3,
      longitude: -74.0060, // USA - New York
      latitude: 40.7128,
    },
    {
      name: 'Los Angeles Classic',
      order: 4,
      longitude: -118.2437, // USA - Los Angeles
      latitude: 34.0522,
    },
    {
      name: 'Miami Championship',
      order: 5,
      longitude: -80.1918, // USA - Miami
      latitude: 25.7617,
    },
    {
      name: 'Seattle Masters',
      order: 6,
      longitude: -122.3321, // USA - Seattle
      latitude: 47.6062,
    },
    // International Tournaments
    {
      name: 'Toronto Open',
      order: 7,
      longitude: -79.3832, // Canada - Toronto
      latitude: 43.6532,
    },
    {
      name: 'London Classic',
      order: 8,
      longitude: -0.1276, // UK - London
      latitude: 51.5074,
    },
    {
      name: 'Paris Masters',
      order: 9,
      longitude: 2.3522, // France - Paris
      latitude: 48.8566,
    },
    {
      name: 'Berlin Grand Prix',
      order: 10,
      longitude: 13.4050, // Germany - Berlin
      latitude: 52.5200,
    },
    {
      name: 'Madrid Championship',
      order: 11,
      longitude: -3.7038, // Spain - Madrid
      latitude: 40.4168,
    },
    {
      name: 'Rome Open',
      order: 12,
      longitude: 12.4964, // Italy - Rome
      latitude: 41.9028,
    },
    {
      name: 'Moscow Grand Prix',
      order: 13,
      longitude: 37.6173, // Russia - Moscow
      latitude: 55.7558,
    },
    {
      name: 'Dubai International',
      order: 14,
      longitude: 55.2708, // UAE - Dubai
      latitude: 25.2048,
    },
    {
      name: 'Mumbai Open',
      order: 15,
      longitude: 72.8777, // India - Mumbai
      latitude: 19.0760,
    },
    {
      name: 'Beijing Championship',
      order: 16,
      longitude: 116.4074, // China - Beijing
      latitude: 39.9042,
    },
    {
      name: 'Shanghai Masters',
      order: 17,
      longitude: 121.4737, // China - Shanghai
      latitude: 31.2304,
    },
    {
      name: 'Tokyo Open',
      order: 18,
      longitude: 139.6503, // Japan - Tokyo
      latitude: 35.6762,
    },
    {
      name: 'Seoul Championship',
      order: 19,
      longitude: 126.9780, // South Korea - Seoul
      latitude: 37.5665,
    },
    {
      name: 'Sydney International',
      order: 20,
      longitude: 151.2093, // Australia - Sydney
      latitude: -33.8688,
    },
    {
      name: 'São Paulo Open',
      order: 21,
      longitude: -46.6333, // Brazil - São Paulo
      latitude: -23.5505,
    },
    {
      name: 'Buenos Aires Classic',
      order: 22,
      longitude: -58.3816, // Argentina - Buenos Aires
      latitude: -34.6037,
    },
  ]

  console.log(`Creating ${regions.length} regions...`)
  const createdRegions = []
  for (const regionData of regions) {
    const region = await prisma.region.create({
      data: regionData,
    })
    createdRegions.push(region)
    console.log(`  ✓ Created region: ${region.name}`)
  }

  // Create Tournament Nodes for each region
  // Each region has: Quarter-Final, Semi-Final, Final
  const roundNames = ['Quarter-Final', 'Semi-Final', 'Final']
  
  // Bot configurations for each round (ELO increases with round and region)
  const getBotConfig = (regionOrder: number, roundIndex: number) => {
    const baseElo = 800 + (regionOrder - 1) * 150 // Base ELO increases per region
    const roundBonus = roundIndex * 100 // Each round is harder
    const elo = baseElo + roundBonus
    
    return {
      elo,
      depth: Math.min(Math.max(Math.floor(elo / 200), 1), 15),
      pawnReward: 10 + (regionOrder - 1) * 5 + roundIndex * 5, // More rewards for later rounds
    }
  }

  console.log('Creating tournament nodes...')
  for (const region of createdRegions) {
    for (let roundIndex = 0; roundIndex < roundNames.length; roundIndex++) {
      const roundName = roundNames[roundIndex]
      const botConfig = getBotConfig(region.order, roundIndex)
      
      const botName = `${roundName} Bot ${region.order}`
      const botAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${botName}` // Using dicebear for avatars
      
      await prisma.tournamentNode.create({
        data: {
          regionId: region.id,
          roundName,
          botName,
          botElo: botConfig.elo,
          botAvatarUrl,
          pawnReward: botConfig.pawnReward,
        },
      })
      
      console.log(`  ✓ Created ${roundName} for ${region.name} (ELO: ${botConfig.elo}, Reward: ${botConfig.pawnReward} pawns)`)
    }
  }

  console.log('\n✅ Tournament seeding completed!')
  console.log(`   - ${createdRegions.length} regions created`)
  console.log(`   - ${createdRegions.length * 3} tournament nodes created`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding tournament data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
