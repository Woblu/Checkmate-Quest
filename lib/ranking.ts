import { prisma } from './prisma'
import { GameResult } from '@prisma/client'
import { evaluateQuests } from '@/actions/quests'

// Rank hierarchy - lower index = lower rank
const RANK_HIERARCHY = [
  'Beginner',
  'Novice',
  'Intermediate',
  'Advanced',
  'Expert',
  'Master',
  'Grandmaster'
]

/**
 * Compare two ranks - returns true if rank1 < rank2 (rank1 is lower than rank2)
 */
function isRankLower(rank1: string, rank2: string): boolean {
  const index1 = RANK_HIERARCHY.indexOf(rank1)
  const index2 = RANK_HIERARCHY.indexOf(rank2)
  
  // If ranks are not in hierarchy, treat as equal
  if (index1 === -1 || index2 === -1) return false
  
  return index1 < index2
}

/**
 * Get the next rank in the hierarchy
 */
function getNextRank(currentRank: string): string | null {
  const currentIndex = RANK_HIERARCHY.indexOf(currentRank)
  if (currentIndex === -1 || currentIndex === RANK_HIERARCHY.length - 1) {
    return null
  }
  return RANK_HIERARCHY[currentIndex + 1]
}

/**
 * Process a game result and update user statistics
 */
export async function processGameResult(gameId: string) {
  // Fetch the game with player information
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

  if (!result) {
    throw new Error(`Game ${gameId} does not have a result yet`)
  }

  // Calculate scores
  let whiteScore = 0
  let blackScore = 0

  switch (result) {
    case GameResult.WHITE_WIN:
      whiteScore = 1
      blackScore = 0
      break
    case GameResult.BLACK_WIN:
      whiteScore = 0
      blackScore = 1
      break
    case GameResult.DRAW:
      whiteScore = 0.5
      blackScore = 0.5
      break
  }

  // Process white player
  await updatePlayerStats(
    whitePlayer.id,
    whiteScore,
    blackPlayer.rank,
    whitePlayer.rank,
    whiteScore > blackScore
  )

  // Evaluate quests for white player if they won
  if (whiteScore > blackScore) {
    await evaluateQuests(whitePlayer.id, 'GAME_WON', 1).catch((error) => {
      console.error('Error evaluating quests for white player:', error)
    })
  }

  // Process black player
  await updatePlayerStats(
    blackPlayer.id,
    blackScore,
    whitePlayer.rank,
    blackPlayer.rank,
    blackScore > whiteScore
  )

  // Evaluate quests for black player if they won
  if (blackScore > whiteScore) {
    await evaluateQuests(blackPlayer.id, 'GAME_WON', 1).catch((error) => {
      console.error('Error evaluating quests for black player:', error)
    })
  }
}

/**
 * Update a player's statistics after a game
 */
async function updatePlayerStats(
  playerId: string,
  score: number,
  opponentRank: string,
  playerRank: string,
  isWinner: boolean
) {
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

  // Check for bonus points (if winner's rank < loser's rank)
  if (isWinner && isRankLower(playerRank, opponentRank)) {
    bonusPoints = 0.5
  }

  // Add score and bonus to cycle points
  cyclePoints += score + bonusPoints

  // Check if player should rank up (>= 10 points in cycle of 20 games)
  if (cyclePoints >= 10 && gamesInCycle <= 20) {
    const nextRank = getNextRank(player.rank)
    if (nextRank) {
      newRank = nextRank
      shouldResetCycle = true
    }
  }

  // Reset cycle after 20 games or after rank up
  if (gamesInCycle >= 20 || shouldResetCycle) {
    cyclePoints = 0
    gamesInCycle = 0
  }

  // Update player
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
