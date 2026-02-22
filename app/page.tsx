'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { GiCoins, GiChessPawn, GiCrossedSwords, GiBookCover, GiPuzzle, GiOpenTreasureChest, GiWorld, GiVisoredHelm, GiTrophy } from 'react-icons/gi'
import { assignDailyQuests } from '@/actions/quests'

interface User {
  id: string
  name: string
  rank: string
  currentPoints: number
  gamesPlayedInCycle: number
  totalGames: number
  pawns: number
}

interface Boss {
  name: string
  elo: number
  regionName: string
}

interface Opening {
  id: string
  name: string
}

interface PuzzleTheme {
  theme: string
  description: string
}

interface LeaderboardUser {
  id: string
  name: string
  rank: string
  currentPoints: number
}

interface Cosmetic {
  id: string
  name: string
  price: number
  type: string
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [boss, setBoss] = useState<Boss | null>(null)
  const [openings, setOpenings] = useState<Opening[]>([])
  const [puzzleTheme, setPuzzleTheme] = useState<PuzzleTheme | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [featuredCosmetics, setFeaturedCosmetics] = useState<Cosmetic[]>([])
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        
        // Assign daily quests if user is logged in
        if (data.user?.id) {
          assignDailyQuests(data.user.id).catch((error) => {
            console.error('Error assigning daily quests:', error)
          })
        }
      } else if (response.status === 401) {
        // User is not authenticated - this is expected when not signed in
        setUser(null)
      } else {
        // Other error - log it but don't crash
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error fetching user:', errorData)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data in parallel
      const [bossRes, openingsRes, puzzleRes, leaderboardRes, cosmeticsRes] = await Promise.all([
        fetch('/api/dashboard/current-boss'),
        fetch('/api/dashboard/openings'),
        fetch('/api/dashboard/puzzle-theme'),
        fetch('/api/dashboard/leaderboard'),
        fetch('/api/dashboard/featured-cosmetics'),
      ])

      if (bossRes.ok) {
        const bossData = await bossRes.json()
        setBoss(bossData.boss)
      }

      if (openingsRes.ok) {
        const openingsData = await openingsRes.json()
        setOpenings(openingsData.openings || [])
      }

      if (puzzleRes.ok) {
        const puzzleData = await puzzleRes.json()
        setPuzzleTheme(puzzleData)
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json()
        setLeaderboard(leaderboardData.users || [])
      }

      if (cosmeticsRes.ok) {
        const cosmeticsData = await cosmeticsRes.json()
        setFeaturedCosmetics(cosmeticsData.cosmetics || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const progressPercentage = user ? (user.gamesPlayedInCycle / 20) * 100 : 0

  // Not logged in - show landing page
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-chess-bg">
        <div className="bg-gradient-to-br from-pawn-gold to-pawn-gold-hover text-slate-900 py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-block w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
              <span className="text-6xl">♔</span>
            </div>
            <h1 className="text-5xl font-extrabold mb-4">Welcome to Chessler</h1>
            <p className="text-xl mb-8 text-slate-900/90">
              Play chess, climb ranks, and compete with players worldwide
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/register"
                className="px-8 py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 bg-white/20 text-slate-900 rounded-lg font-bold hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-chess-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pawn-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-chess-bg">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-slate-950 border-b border-chess-border flex items-center justify-between px-6">
        {/* Left: Logo/Title */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">♔</span>
          <span className="text-xl font-bold text-white">Chessler</span>
        </Link>

        {/* Right: Wallet & Profile */}
        <div className="flex items-center space-x-4">
          {/* Wallet Pill */}
          <div className="flex items-center space-x-2 bg-chess-card px-4 py-2 rounded-full border border-chess-border">
            <GiCoins className="w-6 h-6 text-pawn-gold drop-shadow-md" />
            <span className="text-white font-semibold">{user?.pawns || 0}</span>
            <span className="text-slate-300 text-sm">pawns</span>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 bg-chess-card px-4 py-2 rounded-lg border border-chess-border hover:bg-slate-700 transition-colors"
            >
              <span className="text-white font-medium">{user?.name}</span>
              <GiVisoredHelm className="w-4 h-4 text-slate-400" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-chess-card rounded-xl border border-chess-border shadow-xl z-50">
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300 text-sm">Rank</span>
                      <span className="text-white font-semibold">{user?.rank}</span>
                    </div>
                    <div className="w-full bg-chess-bg rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pawn-gold to-pawn-gold-hover transition-all"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      {user?.gamesPlayedInCycle || 0} / 20 games
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="block w-full text-center px-4 py-2 bg-pawn-gold hover:bg-pawn-gold-hover text-slate-900 font-bold rounded-lg transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout - 12 Column Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Hero Section - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-gradient-to-br from-chess-card to-slate-700 rounded-xl p-8 border border-chess-border relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }} />
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl font-extrabold text-white mb-2">World Tour Campaign</h2>
                {boss ? (
                  <>
                    <p className="text-slate-300 mb-4">
                      Next up: <span className="text-pawn-gold font-semibold">{boss.name}</span> in {boss.regionName}
                    </p>
                    <p className="text-slate-300 text-sm mb-6">Bot ELO: {boss.elo}</p>
                    <Link
                      href="/campaign"
                      className="inline-block px-6 py-3 bg-pawn-gold hover:bg-pawn-gold-hover text-slate-900 font-bold rounded-lg transition-colors"
                    >
                      Resume Campaign
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-slate-300 mb-6">Start your journey around the world!</p>
                    <Link
                      href="/campaign"
                      className="inline-block px-6 py-3 bg-pawn-gold hover:bg-pawn-gold-hover text-slate-900 font-bold rounded-lg transition-colors"
                    >
                      Start Campaign
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Play & Multiplayer - 4 columns */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Play Family Online */}
            <div className="bg-chess-card rounded-xl p-6 border border-chess-border">
              <h3 className="text-xl font-extrabold text-white mb-4">Play Family Online</h3>
              <Link
                href="/play"
                className="block w-full text-center px-4 py-3 bg-pawn-gold hover:bg-pawn-gold-hover text-slate-900 font-bold rounded-lg transition-colors"
              >
                Find Match
              </Link>
            </div>

            {/* Bot Arena */}
            <div className="bg-chess-card rounded-xl p-6 border border-chess-border">
              <h3 className="text-xl font-extrabold text-white mb-4">Bot Arena</h3>
              <Link
                href="/play/bot"
                className="block w-full text-center px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                Challenge Bot
              </Link>
            </div>
          </div>

          {/* Training Hub - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <h3 className="text-2xl font-bold text-white mb-4">Daily Training</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Openings Card */}
              <div className="bg-chess-card rounded-xl p-6 border border-chess-border">
                <div className="flex items-center space-x-3 mb-4">
                  <GiBookCover className="w-8 h-8 text-pawn-gold drop-shadow-md" />
                  <h4 className="text-xl font-extrabold text-white">Openings to Review</h4>
                </div>
                <p className="text-slate-300 mb-4">
                  {openings.length > 0
                    ? `${openings.length} opening${openings.length > 1 ? 's' : ''} need practice`
                    : 'All openings mastered!'}
                </p>
                {openings.length > 0 ? (
                  <Link
                    href="/learn"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-pawn-gold hover:bg-pawn-gold-hover text-slate-900 font-bold rounded-lg transition-colors"
                  >
                    <GiBookCover className="text-xl drop-shadow-md" />
                    Train Next Line
                  </Link>
                ) : (
                  <div className="text-center px-4 py-2 bg-slate-700 text-slate-400 rounded-lg">
                    All Caught Up!
                  </div>
                )}
              </div>

              {/* Puzzles Card */}
              <div className="bg-chess-card rounded-xl p-6 border border-chess-border">
                <div className="flex items-center space-x-3 mb-4">
                  <GiPuzzle className="w-8 h-8 text-pawn-gold drop-shadow-md" />
                  <h4 className="text-xl font-extrabold text-white">Puzzle Training</h4>
                </div>
                <p className="text-slate-300 mb-4">
                  {puzzleTheme ? puzzleTheme.description : 'Master your tactical skills'}
                </p>
                <Link
                  href="/puzzles"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-pawn-gold hover:bg-pawn-gold-hover text-slate-900 font-bold rounded-lg transition-colors"
                >
                  <GiPuzzle className="text-xl drop-shadow-md" />
                  Solve for 5 Pawns
                </Link>
              </div>
            </div>
          </div>

          {/* Shop & Leaderboard Sidebar - 4 columns */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Family Standings */}
            <div className="bg-chess-card rounded-xl p-6 border border-chess-border">
              <div className="flex items-center space-x-2 mb-4">
                <GiTrophy className="w-6 h-6 text-pawn-gold drop-shadow-md" />
                <h3 className="text-xl font-extrabold text-white">Family Standings</h3>
              </div>
              <div className="space-y-3">
                {leaderboard.length > 0 ? (
                  leaderboard.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-pawn-gold font-bold">#{index + 1}</span>
                        <span className="text-white">{player.name}</span>
                      </div>
                      <span className="text-slate-300 text-sm">{player.rank}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-300 text-sm">No players yet</p>
                )}
              </div>
            </div>

            {/* Featured Cosmetics */}
            <div className="bg-chess-card rounded-xl p-6 border border-chess-border">
              <div className="flex items-center space-x-2 mb-4">
                <GiOpenTreasureChest className="w-6 h-6 text-pawn-gold drop-shadow-md" />
                <h3 className="text-xl font-extrabold text-white">Featured Cosmetics</h3>
              </div>
              <div className="space-y-3">
                {featuredCosmetics.length > 0 ? (
                  featuredCosmetics.map((cosmetic) => (
                    <Link
                      key={cosmetic.id}
                      href="/shop"
                      className="block p-3 bg-chess-bg rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{cosmetic.name}</span>
                        <span className="text-pawn-gold font-semibold">{cosmetic.price} ♟</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-slate-300 text-sm">No featured items</p>
                )}
                <Link
                  href="/shop"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-pawn-gold hover:bg-pawn-gold-hover text-slate-900 font-bold rounded-lg transition-colors mt-4"
                >
                  <GiOpenTreasureChest className="text-xl drop-shadow-md" />
                  Visit Shop
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
