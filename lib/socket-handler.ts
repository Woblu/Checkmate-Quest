import { Server, Socket } from 'socket.io'
import { Chess } from 'chess.js'
import { prisma } from './prisma'
import { processGameResult } from './ranking'
import { GameResult } from '@prisma/client'

interface GameState {
  chess: Chess
  whitePlayerId: string
  blackPlayerId: string
  gameId: string
  currentTurn: 'w' | 'b'
  gameOver: boolean
  result?: GameResult
}

// Store active games in memory (in production, use Redis or database)
const activeGames = new Map<string, GameState>()

// Store socket to game mapping
const socketToGame = new Map<string, string>()
const socketToPlayer = new Map<string, { gameId: string; playerId: string; color: 'white' | 'black' }>()

export default function socketHandler(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id)

    // Join game
    socket.on('join_game', async (data: { gameId: string; playerId: string }) => {
      try {
        const { gameId, playerId } = data

        if (!gameId || !playerId) {
          socket.emit('error', { message: 'gameId and playerId are required' })
          return
        }

        // Fetch game from database
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

        // Determine player color
        let color: 'white' | 'black'
        if (game.whitePlayerId === playerId) {
          color = 'white'
        } else if (game.blackPlayerId === playerId) {
          color = 'black'
        } else {
          socket.emit('error', { message: 'You are not a player in this game' })
          return
        }

        // Check if game already exists in memory, otherwise create it
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

        // Join socket room
        socket.join(gameId)
        socketToGame.set(socket.id, gameId)
        socketToPlayer.set(socket.id, { gameId, playerId, color })

        // Send current game state
        socket.emit('game_state', {
          fen: gameState.chess.fen(),
          currentTurn: gameState.currentTurn,
          gameOver: gameState.gameOver,
          result: gameState.result,
          yourColor: color,
          whitePlayer: game.whitePlayer.name,
          blackPlayer: game.blackPlayer.name,
        })

        // Notify other players
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
    socket.on('make_move', async (data: { from: string; to: string; promotion?: string }) => {
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

        // Check if it's the player's turn
        const expectedColor = gameState.currentTurn === 'w' ? 'white' : 'black'
        if (color !== expectedColor) {
          socket.emit('error', { message: 'Not your turn' })
          return
        }

        // Validate and make move
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

          // Update turn
          gameState.currentTurn = gameState.chess.turn()

          // Check if game is over
          if (gameState.chess.isCheckmate()) {
            gameState.gameOver = true
            if (gameState.currentTurn === 'w') {
              gameState.result = GameResult.BLACK_WIN
            } else {
              gameState.result = GameResult.WHITE_WIN
            }
          } else if (gameState.chess.isDraw()) {
            gameState.gameOver = true
            gameState.result = GameResult.DRAW
          } else if (gameState.chess.isStalemate()) {
            gameState.gameOver = true
            gameState.result = GameResult.DRAW
          }

          // Broadcast move to all players in the game
          io.to(gameId).emit('move_made', {
            from: move.from,
            to: move.to,
            fen: gameState.chess.fen(),
            currentTurn: gameState.currentTurn,
            gameOver: gameState.gameOver,
            result: gameState.result,
          })

          // If game is over, process the result
          if (gameState.gameOver && gameState.result) {
            // Update game in database
            await prisma.game.update({
              where: { id: gameId },
              data: {
                result: gameState.result,
              },
            })

            // Process ranking
            try {
              await processGameResult(gameId)
            } catch (error) {
              console.error('Error processing game result:', error)
            }

            // Notify players
            io.to(gameId).emit('game_over', {
              result: gameState.result,
              fen: gameState.chess.fen(),
            })

            // Clean up after a delay
            setTimeout(() => {
              activeGames.delete(gameId)
            }, 60000) // Remove after 1 minute
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

    // Handle disconnect
    socket.on('disconnect', () => {
      const gameId = socketToGame.get(socket.id)
      if (gameId) {
        socket.to(gameId).emit('player_left', {
          playerId: socketToPlayer.get(socket.id)?.playerId,
        })
      }
      socketToGame.delete(socket.id)
      socketToPlayer.delete(socket.id)
      console.log('Client disconnected:', socket.id)
    })
  })
}
