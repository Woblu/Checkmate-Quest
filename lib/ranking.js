// JavaScript version of ranking function for socket handler
const { PrismaClient, GameResult } = require('@prisma/client')
const prisma = new PrismaClient()

const RANK_HIERARCHY = [
  'Beginner',
  'Novice',
  'Intermediate',
  'Advanced',
  'Expert',
  'Master',
  'Grandmaster'
]

function isRankLower(rank1, rank2) {
  const index1 = RANK_HIERARCHY.indexOf(rank1)
  const index2 = RANK_HIERARCHY.indexOf(rank2)
  
  if (index1 === -1 || index2 === -1) return false
  
  return index1 < index2
}

function getNextRank(currentRank) {
  const currentIndex = RANK_HIERARCHY.indexOf(currentRank)
  if (currentIndex === -1 || currentIndex === RANK_HIERARCHY.length - 1) {
    return null
  }
  return RANK_HIERARCHY[currentIndex + 1]
}

async function updatePlayerStats(playerId, score, opponentRank, playerRank, isWinner) {
  const player = await prisma.user.findUnique({
    where: { id: playerId },
  })

  if (!player) {
    throw new Error(`Player with id ${playerId} not found`)
  }

  let bonusPoints = 0
  let cyclePoints = player.currentPoints
  let gamesInCycle = player.gamesPlayedInCycle + 1
  let totalGames = player.totalGames + 1
  let newRank = player.rank
  let shouldResetCycle = false

  if (isWinner && isRankLower(playerRank, opponentRank)) {
    bonusPoints = 0.5
  }

  cyclePoints += score + bonusPoints

  if (cyclePoints >= 10 && gamesInCycle <= 20) {
    const nextRank = getNextRank(player.rank)
    if (nextRank) {
      newRank = nextRank
      shouldResetCycle = true
    }
  }

  if (gamesInCycle >= 20 || shouldResetCycle) {
    cyclePoints = 0
    gamesInCycle = 0
  }

  await prisma.user.update({
    where: { id: playerId },
    data: {
      currentPoints: cyclePoints,
      gamesPlayedInCycle: gamesInCycle,
      totalGames: totalGames,
      rank: newRank,
    },
  })
}

async function processGameResult(gameId) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      whitePlayer: true,
      blackPlayer: true,
    },
  })

  if (!game) {
    throw new Error(`Game with id ${gameId} not found`)
  }

  const { whitePlayer, blackPlayer, result } = game

  let whiteScore = 0
  let blackScore = 0

  switch (result) {
    case 'WHITE_WIN':
      whiteScore = 1
      blackScore = 0
      break
    case 'BLACK_WIN':
      whiteScore = 0
      blackScore = 1
      break
    case 'DRAW':
      whiteScore = 0.5
      blackScore = 0.5
      break
  }

  await updatePlayerStats(
    whitePlayer.id,
    whiteScore,
    blackPlayer.rank,
    whitePlayer.rank,
    whiteScore > blackScore
  )

  await updatePlayerStats(
    blackPlayer.id,
    blackScore,
    whitePlayer.rank,
    blackPlayer.rank,
    blackScore > whiteScore
  )
}

module.exports = { processGameResult }
