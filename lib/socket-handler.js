const { Chess } = require('chess.js')
const { PrismaClient } = require('@prisma/client')
const { processGameResult } = require('./ranking')

const prisma = new PrismaClient()

// Store active games in memory
const activeGames = new Map()
const socketToGame = new Map()
const socketToPlayer = new Map()

// Matchmaking queue
const matchmakingQueue = []
const socketToPlayerInfo = new Map() // socket.id -> { playerId, name, rank }

module.exports = function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join game
    socket.on('join_game', async (data) => {
      try {
        const { gameId, playerId } = data

        if (!gameId || !playerId) {
          socket.emit('error', { message: 'gameId and playerId are required' })
          return
        }

        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: {
            whitePlayer: true,
            blackPlayer: true,
          },
        })

        if (!game) {
          socket.emit('error', { message: 'Game not found' })
          return
        }

        // If game already has a result, it's finished
        if (game.result) {
          socket.emit('error', { message: 'This game has already finished' })
          return
        }

        let color
        if (game.whitePlayerId === playerId) {
          color = 'white'
        } else if (game.blackPlayerId === playerId) {
          color = 'black'
        } else {
          socket.emit('error', { message: 'You are not a player in this game' })
          return
        }

        let gameState = activeGames.get(gameId)
        if (!gameState) {
          gameState = {
            chess: new Chess(),
            whitePlayerId: game.whitePlayerId,
            blackPlayerId: game.blackPlayerId,
            gameId: gameId,
            currentTurn: 'w',
            gameOver: false,
          }
          activeGames.set(gameId, gameState)
        }

        socket.join(gameId)
        socketToGame.set(socket.id, gameId)
        socketToPlayer.set(socket.id, { gameId, playerId, color })

        socket.emit('game_state', {
          fen: gameState.chess.fen(),
          currentTurn: gameState.currentTurn,
          gameOver: gameState.gameOver,
          result: gameState.result,
          yourColor: color,
          whitePlayer: game.whitePlayer.name,
          blackPlayer: game.blackPlayer.name,
        })

        socket.to(gameId).emit('player_joined', {
          playerId,
          color,
        })
      } catch (error) {
        console.error('Error joining game:', error)
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to join game',
        })
      }
    })

    // Make move
    socket.on('make_move', async (data) => {
      try {
        const { from, to, promotion } = data
        const playerInfo = socketToPlayer.get(socket.id)

        if (!playerInfo) {
          socket.emit('error', { message: 'You must join a game first' })
          return
        }

        const { gameId, playerId, color } = playerInfo
        const gameState = activeGames.get(gameId)

        if (!gameState) {
          socket.emit('error', { message: 'Game not found' })
          return
        }

        if (gameState.gameOver) {
          socket.emit('error', { message: 'Game is over' })
          return
        }

        const expectedColor = gameState.currentTurn === 'w' ? 'white' : 'black'
        if (color !== expectedColor) {
          socket.emit('error', { message: 'Not your turn' })
          return
        }

        try {
          const move = gameState.chess.move({
            from,
            to,
            promotion: promotion || 'q',
          })

          if (!move) {
            socket.emit('error', { message: 'Invalid move' })
            return
          }

          gameState.currentTurn = gameState.chess.turn()

          if (gameState.chess.isCheckmate()) {
            gameState.gameOver = true
            // After a move, currentTurn is the next player's turn
            // So if it's white's turn after the move, black just won
            if (gameState.currentTurn === 'w') {
              gameState.result = 'BLACK_WIN'
            } else {
              gameState.result = 'WHITE_WIN'
            }
          } else if (gameState.chess.isDraw() || gameState.chess.isStalemate()) {
            gameState.gameOver = true
            gameState.result = 'DRAW'
          }

          io.to(gameId).emit('move_made', {
            from: move.from,
            to: move.to,
            fen: gameState.chess.fen(),
            currentTurn: gameState.currentTurn,
            gameOver: gameState.gameOver,
            result: gameState.result,
          })

          if (gameState.gameOver && gameState.result) {
            await prisma.game.update({
              where: { id: gameId },
              data: {
                result: gameState.result,
              },
            })

            try {
              await processGameResult(gameId)
            } catch (error) {
              console.error('Error processing game result:', error)
            }

            io.to(gameId).emit('game_over', {
              result: gameState.result,
              fen: gameState.chess.fen(),
            })

            setTimeout(() => {
              activeGames.delete(gameId)
            }, 60000)
          }
        } catch (error) {
          socket.emit('error', {
            message: error instanceof Error ? error.message : 'Invalid move',
          })
        }
      } catch (error) {
        console.error('Error making move:', error)
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to make move',
        })
      }
    })

    // Join matchmaking queue
    socket.on('join_queue', async (data) => {
      try {
        const { playerId, name, rank } = data

        if (!playerId) {
          socket.emit('error', { message: 'playerId is required' })
          return
        }

        // Check if already in queue
        const alreadyInQueue = matchmakingQueue.find(p => p.playerId === playerId)
        if (alreadyInQueue) {
          socket.emit('queue_status', { inQueue: true, message: 'Already in queue' })
          return
        }

        // Check if already in a game
        const inGame = socketToGame.get(socket.id)
        if (inGame) {
          socket.emit('error', { message: 'You are already in a game' })
          return
        }

        const playerInfo = { playerId, name: name || 'Player', rank: rank || 'Beginner', socketId: socket.id }
        matchmakingQueue.push(playerInfo)
        socketToPlayerInfo.set(socket.id, playerInfo)

        socket.emit('queue_status', { inQueue: true, message: 'Searching for opponent...' })
        console.log(`Player ${playerId} joined queue. Queue size: ${matchmakingQueue.length}`)

        // Try to match players
        if (matchmakingQueue.length >= 2) {
          const player1 = matchmakingQueue.shift()
          const player2 = matchmakingQueue.shift()

          // Remove from queue tracking
          socketToPlayerInfo.delete(player1.socketId)
          socketToPlayerInfo.delete(player2.socketId)

          // Create game
          const isWhite = Math.random() > 0.5
          const whitePlayerId = isWhite ? player1.playerId : player2.playerId
          const blackPlayerId = isWhite ? player2.playerId : player1.playerId

          const game = await prisma.game.create({
            data: {
              whitePlayerId,
              blackPlayerId,
              result: null,
              isOnline: true,
            },
            include: {
              whitePlayer: {
                select: { id: true, name: true },
              },
              blackPlayer: {
                select: { id: true, name: true },
              },
            },
          })

          // Notify both players
          io.to(player1.socketId).emit('match_found', {
            gameId: game.id,
            opponent: isWhite ? player2.name : player1.name,
            color: isWhite ? 'white' : 'black',
          })

          io.to(player2.socketId).emit('match_found', {
            gameId: game.id,
            opponent: isWhite ? player1.name : player2.name,
            color: isWhite ? 'black' : 'white',
          })

          console.log(`Matched ${player1.playerId} vs ${player2.playerId}, game: ${game.id}`)
        }
      } catch (error) {
        console.error('Error joining queue:', error)
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to join queue',
        })
      }
    })

    // Leave matchmaking queue
    socket.on('leave_queue', () => {
      const playerInfo = socketToPlayerInfo.get(socket.id)
      if (playerInfo) {
        const index = matchmakingQueue.findIndex(p => p.playerId === playerInfo.playerId)
        if (index !== -1) {
          matchmakingQueue.splice(index, 1)
        }
        socketToPlayerInfo.delete(socket.id)
        socket.emit('queue_status', { inQueue: false, message: 'Left queue' })
        console.log(`Player ${playerInfo.playerId} left queue`)
      }
    })

    socket.on('disconnect', () => {
      // Remove from game
      const gameId = socketToGame.get(socket.id)
      if (gameId) {
        socket.to(gameId).emit('player_left', {
          playerId: socketToPlayer.get(socket.id)?.playerId,
        })
      }
      socketToGame.delete(socket.id)
      socketToPlayer.delete(socket.id)

      // Remove from queue
      const playerInfo = socketToPlayerInfo.get(socket.id)
      if (playerInfo) {
        const index = matchmakingQueue.findIndex(p => p.playerId === playerInfo.playerId)
        if (index !== -1) {
          matchmakingQueue.splice(index, 1)
        }
        socketToPlayerInfo.delete(socket.id)
        console.log(`Player ${playerInfo.playerId} disconnected from queue`)
      }

      console.log('Client disconnected:', socket.id)
    })
  })
}
