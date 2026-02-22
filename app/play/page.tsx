'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { io, Socket } from 'socket.io-client'
import { GiCrossedSwords, GiChessPawn } from 'react-icons/gi'

export default function PlayPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inQueue, setInQueue] = useState(false)
  const [queueMessage, setQueueMessage] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        transports: ['websocket'],
      })

      newSocket.on('connect', () => {
        console.log('Connected to matchmaking server')
        setSocket(newSocket)
        socketRef.current = newSocket
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from matchmaking server')
        setInQueue(false)
        setQueueMessage('')
      })

      newSocket.on('queue_status', (data: { inQueue: boolean; message: string }) => {
        setInQueue(data.inQueue)
        setQueueMessage(data.message)
      })

      newSocket.on('match_found', (data: { gameId: string; opponent: string; color: string }) => {
        setInQueue(false)
        setQueueMessage('')
        // Redirect to game
        router.push(`/play/${data.gameId}`)
      })

      newSocket.on('error', (data: { message: string }) => {
        setQueueMessage(data.message)
        setInQueue(false)
      })

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leave_queue')
          socketRef.current.close()
        }
      }
    }
  }, [user, router])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      router.push('/login')
    }
  }

  const findMatch = () => {
    if (!socket || !user) {
      alert('Not connected. Please refresh the page.')
      return
    }

    if (inQueue) {
      // Leave queue
      socket.emit('leave_queue')
      setInQueue(false)
      setQueueMessage('')
    } else {
      // Join queue
      socket.emit('join_queue', {
        playerId: user.id,
        name: user.name,
        rank: user.rank,
      })
      setInQueue(true)
      setQueueMessage('Searching for opponent...')
    }
  }

  useEffect(() => {
    if (user) {
      setLoading(false)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-chess-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pawn-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-chess-bg">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-4">Play Chess</h1>
          <p className="text-slate-300">Start a new game or continue an existing one</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-chess-card rounded-xl shadow-lg p-8 border border-chess-border">
            <div className="flex justify-center mb-4">
              <GiCrossedSwords className="text-6xl text-pawn-gold drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-4 text-center">
              Quick Match
            </h2>
            
            <p className="text-slate-300 mb-6 text-center">
              Find an opponent instantly
            </p>

            {queueMessage && (
              <div className={`mb-4 p-3 rounded-lg text-center ${
                inQueue 
                  ? 'bg-blue-900/30 border border-blue-500/50 text-blue-300' 
                  : 'bg-chess-bg border border-chess-border text-slate-300'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {inQueue && (
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{queueMessage}</span>
                </div>
              </div>
            )}

            <button
              onClick={findMatch}
              disabled={!socket}
              className={`w-full py-3 rounded-lg transition-colors font-bold flex items-center justify-center gap-2 ${
                inQueue
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-pawn-gold hover:bg-pawn-gold-hover text-slate-900'
              } disabled:bg-slate-600 disabled:cursor-not-allowed`}
            >
              {inQueue ? (
                <>
                  <span>Cancel Search</span>
                </>
              ) : (
                <>
                  <GiCrossedSwords className="text-xl drop-shadow-md" />
                  <span>Find Match</span>
                </>
              )}
            </button>

            {!socket && (
              <p className="text-sm text-slate-400 text-center mt-2">
                Connecting to server...
              </p>
            )}
          </div>

          <Link
            href="/play/bot"
            className="bg-chess-card rounded-xl shadow-lg p-8 border border-chess-border hover:border-pawn-gold transition-colors block"
          >
            <div className="flex justify-center mb-4">
              <GiCrossedSwords className="text-6xl text-pawn-gold drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-4 text-center">
              Play Against Bots
            </h2>
            <p className="text-slate-300 mb-6 text-center">
              Practice against AI opponents
            </p>
            <div className="text-center">
              <span className="text-pawn-gold font-medium">Play Now →</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
