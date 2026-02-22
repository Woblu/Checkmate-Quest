'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, SignInButton, useUser } from '@clerk/nextjs'
import { GiChessKing, GiVisoredHelm, GiCrossedSwords, GiBookCover, GiOpenTreasureChest, GiWorld, GiPuzzle } from 'react-icons/gi'
import { HiCog } from 'react-icons/hi'

export default function Navbar() {
  const pathname = usePathname()
  const { isSignedIn, user } = useUser()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-slate-950 border-b border-chess-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pawn-gold to-pawn-gold-hover rounded flex items-center justify-center">
                <GiChessKing className="text-slate-900 text-xl" />
              </div>
              <span className="text-white font-bold text-xl">Chessler</span>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-pawn-gold text-slate-900'
                    : 'text-slate-300 hover:bg-chess-card hover:text-white'
                }`}
              >
                Home
              </Link>
              {isSignedIn && (
                <>
                  <Link
                    href="/profile"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive('/profile')
                        ? 'bg-pawn-gold text-slate-900'
                        : 'text-slate-300 hover:bg-chess-card hover:text-white'
                    }`}
                  >
                    <GiVisoredHelm className="text-2xl drop-shadow-md" />
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive('/settings')
                        ? 'bg-pawn-gold text-slate-900'
                        : 'text-slate-300 hover:bg-chess-card hover:text-white'
                    }`}
                  >
                    <HiCog className="text-2xl drop-shadow-md" />
                    Settings
                  </Link>
                  <Link
                    href="/play"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive('/play')
                        ? 'bg-pawn-gold text-slate-900'
                        : 'text-slate-300 hover:bg-chess-card hover:text-white'
                    }`}
                  >
                    <GiCrossedSwords className="text-2xl drop-shadow-md" />
                    Play
                  </Link>
                      <Link
                        href="/learn"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                          isActive('/learn')
                            ? 'bg-pawn-gold text-slate-900'
                            : 'text-slate-300 hover:bg-chess-card hover:text-white'
                        }`}
                      >
                        <GiBookCover className="text-2xl drop-shadow-md" />
                        Learn
                      </Link>
                      <Link
                        href="/shop"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                          isActive('/shop')
                            ? 'bg-pawn-gold text-slate-900'
                            : 'text-slate-300 hover:bg-chess-card hover:text-white'
                        }`}
                      >
                        <GiOpenTreasureChest className="text-2xl drop-shadow-md" />
                        Shop
                      </Link>
                      <Link
                        href="/campaign"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                          isActive('/campaign')
                            ? 'bg-pawn-gold text-slate-900'
                            : 'text-slate-300 hover:bg-chess-card hover:text-white'
                        }`}
                      >
                        <GiWorld className="text-2xl drop-shadow-md" />
                        Campaign
                      </Link>
                      <Link
                        href="/puzzles"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                          isActive('/puzzles')
                            ? 'bg-pawn-gold text-slate-900'
                            : 'text-slate-300 hover:bg-chess-card hover:text-white'
                        }`}
                      >
                        <GiPuzzle className="text-2xl drop-shadow-md" />
                        Puzzles
                      </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-pawn-gold hover:bg-pawn-gold-hover text-slate-900 font-bold rounded-lg transition-colors text-sm">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
