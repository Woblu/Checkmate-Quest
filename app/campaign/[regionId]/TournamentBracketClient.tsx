'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play, Trophy, Lock } from 'lucide-react'

interface TournamentNode {
  id: string
  roundName: string
  botName: string
  botElo: number
  botAvatarUrl: string
  pawnReward: number
  isCompleted: boolean
  isPlayable: boolean
  isLocked: boolean
}

interface UserProgress {
  currentRegionId: string | null
  highestRoundCleared: string | null
}

export default function TournamentBracketPage() {
  const params = useParams()
  const router = useRouter()
  const regionId = params.regionId as string

  const [nodes, setNodes] = useState<TournamentNode[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    fetchTournamentData()
    fetchUserName()
  }, [regionId])

  const fetchUserName = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUserName(data.user.name || 'You')
        }
      }
    } catch (err) {
      console.error('Error fetching user name:', err)
    }
  }

  const fetchTournamentData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/campaign/tournaments/${regionId}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch tournament data')
      }

      const data = await response.json()
      setNodes(data.nodes || [])
      setUserProgress(data.userProgress)
    } catch (err) {
      console.error('Error fetching tournament data:', err)
      setError('Failed to load tournament')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayMatch = (nodeId: string) => {
    router.push(`/play/bot?nodeId=${nodeId}`)
  }

  const roundOrder = ['Quarter-Final', 'Semi-Final', 'Final']
  const rounds = roundOrder.map(roundName => ({
    name: roundName,
    nodes: nodes.filter(n => n.roundName === roundName),
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#7fa650] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/campaign')}
            className="text-[#7fa650] hover:text-[#9fcf70] mb-4 text-sm"
          >
            ← Back to World Map
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Tournament Bracket</h1>
          <p className="text-gray-400">Defeat your opponents to advance!</p>
        </div>

        {/* Bracket */}
        <div className="flex flex-col lg:flex-row justify-center items-start gap-8 lg:gap-16">
          {rounds.map((round, roundIndex) => (
            <div key={round.name} className="flex-1">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-white">{round.name}</h2>
              </div>

              <div className="space-y-4">
                {round.nodes.map((node, nodeIndex) => {
                  const isPlayable = node.isPlayable && !node.isCompleted
                  const isCompleted = node.isCompleted
                  const isLocked = node.isLocked

                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: roundIndex * 0.1 + nodeIndex * 0.05 }}
                      className="relative"
                    >
                      {/* Match Card */}
                      <div
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isLocked
                            ? 'bg-[#2d2d2d] border-[#3d3d3d] opacity-50'
                            : isCompleted
                            ? 'bg-[#2d4a3a] border-[#7fa650]'
                            : isPlayable
                            ? 'bg-[#3a5a4a] border-[#7fa650] shadow-lg shadow-[#7fa650]/50'
                            : 'bg-[#2d2d2d] border-[#5a5a5a]'
                        }`}
                      >
                        {/* Player vs Bot */}
                        <div className="flex items-center justify-between">
                          {/* Player Side */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-[#7fa650] flex items-center justify-center text-white font-bold">
                              {userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{userName}</div>
                              <div className="text-gray-400 text-sm">Player</div>
                            </div>
                          </div>

                          {/* VS */}
                          <div className="text-gray-500 font-bold mx-4">VS</div>

                          {/* Bot Side */}
                          <div className="flex items-center gap-3 flex-1 justify-end">
                            <div>
                              <div className="text-white font-semibold text-right">{node.botName}</div>
                              <div className="text-gray-400 text-sm text-right">ELO {node.botElo}</div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#3d3d3d] border-2 border-[#5a5a5a] flex items-center justify-center overflow-hidden">
                              {node.botAvatarUrl ? (
                                <img
                                  src={node.botAvatarUrl}
                                  alt={node.botName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23333"/%3E%3Ctext x="50" y="50" font-size="40" fill="%23fff" text-anchor="middle" dominant-baseline="middle"%3E♔%3C/text%3E%3C/svg%3E'
                                  }}
                                />
                              ) : (
                                <div className="text-white text-xl">♔</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Match Info */}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-gray-400 text-sm">
                            Reward: <span className="text-[#7fa650] font-semibold">{node.pawnReward} pawns</span>
                          </div>

                          {/* Action Button */}
                          {isLocked ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Lock className="w-4 h-4" />
                              <span className="text-sm">Locked</span>
                            </div>
                          ) : isCompleted ? (
                            <div className="flex items-center gap-2 text-[#7fa650]">
                              <Trophy className="w-4 h-4" />
                              <span className="text-sm font-semibold">Completed</span>
                            </div>
                          ) : isPlayable ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePlayMatch(node.id)}
                              className="flex items-center gap-2 bg-[#7fa650] hover:bg-[#9fcf70] text-white px-4 py-2 rounded-lg font-semibold transition-colors animate-pulse"
                            >
                              <Play className="w-4 h-4" />
                              <span>Play Match</span>
                            </motion.button>
                          ) : (
                            <div className="text-gray-500 text-sm">Complete previous rounds</div>
                          )}
                        </div>
                      </div>

                      {/* Connector Line (for visual bracket flow) */}
                      {roundIndex < rounds.length - 1 && nodeIndex === 0 && (
                        <div className="absolute left-1/2 top-full w-0.5 h-8 bg-[#3d3d3d] transform -translate-x-1/2" />
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
