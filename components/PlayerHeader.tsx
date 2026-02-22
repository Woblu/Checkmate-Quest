'use client'

import { useEffect, useState, useRef } from 'react'

interface PlayerHeaderProps {
  playerName: string
  rank?: string
  points?: number
  capturedPieces: string[]
  isActive: boolean
  timeLeft?: number // in seconds
  onTimeUp?: () => void
  pieceSet?: string // User's selected piece set
}

export default function PlayerHeader({
  playerName,
  rank,
  points,
  capturedPieces,
  isActive,
  timeLeft,
  onTimeUp,
  pieceSet = 'caliente',
}: PlayerHeaderProps) {
  const [displayTime, setDisplayTime] = useState(timeLeft || 0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeLeft !== undefined) {
      setDisplayTime(timeLeft)
    }
  }, [timeLeft])

  useEffect(() => {
    if (isActive && timeLeft !== undefined && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setDisplayTime((prev) => {
          const newTime = prev - 1
          if (newTime <= 0) {
            if (onTimeUp) {
              onTimeUp()
            }
            return 0
          }
          return newTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, timeLeft, onTimeUp])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getPieceImage = (piece: string): string => {
    // Map piece notation to image path using user's selected piece set
    // piece is lowercase (p, r, n, b, q, k) for captured pieces
    const normalizedPieceSet = pieceSet?.toLowerCase() || 'caliente'
    const pieceMap: { [key: string]: string } = {
      p: `/pieces/${normalizedPieceSet}/bP.svg`, // Black pawn
      r: `/pieces/${normalizedPieceSet}/bR.svg`, // Black rook
      n: `/pieces/${normalizedPieceSet}/bN.svg`, // Black knight
      b: `/pieces/${normalizedPieceSet}/bB.svg`, // Black bishop
      q: `/pieces/${normalizedPieceSet}/bQ.svg`, // Black queen
      k: `/pieces/${normalizedPieceSet}/bK.svg`, // Black king
      P: `/pieces/${normalizedPieceSet}/wP.svg`, // White pawn
      R: `/pieces/${normalizedPieceSet}/wR.svg`, // White rook
      N: `/pieces/${normalizedPieceSet}/wN.svg`, // White knight
      B: `/pieces/${normalizedPieceSet}/wB.svg`, // White bishop
      Q: `/pieces/${normalizedPieceSet}/wQ.svg`, // White queen
      K: `/pieces/${normalizedPieceSet}/wK.svg`, // White king
    }
    return pieceMap[piece] || ''
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
        isActive
          ? 'bg-[#3a5a4a] border-[#4a7c59] shadow-lg'
          : 'bg-[#2d2d2d] border-[#3d3d3d]'
      }`}
    >
      {/* Left side: Player info */}
      <div className="flex items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#f0d9b5]">{playerName}</h3>
          {(rank || points !== undefined) && (
            <div className="text-sm text-[#b58863]">
              {rank && <span>{rank}</span>}
              {rank && points !== undefined && <span> • </span>}
              {points !== undefined && <span>{points.toFixed(1)} pts</span>}
            </div>
          )}
        </div>
      </div>

      {/* Center: Captured pieces */}
      <div className="flex items-center gap-1 flex-1 justify-center flex-wrap max-w-md">
        {capturedPieces.length > 0 ? (
          capturedPieces.map((piece, index) => (
            <img
              key={index}
              src={getPieceImage(piece)}
              alt={`Captured ${piece}`}
              className="w-4 h-4 opacity-60 object-contain"
              onError={(e) => {
                // Fallback to default set if image not found
                const target = e.target as HTMLImageElement
                if (!target.src.includes('/caliente/')) {
                  target.src = getPieceImage(piece).replace(`/${pieceSet}/`, '/caliente/')
                } else {
                  target.style.display = 'none'
                }
              }}
            />
          ))
        ) : (
          <span className="text-[#6b6b6b] text-sm">No captures</span>
        )}
      </div>

      {/* Right side: Timer */}
      <div className="flex items-center gap-2">
        <div
          className={`text-2xl font-mono font-bold ${
            displayTime < 60 ? 'text-red-400' : 'text-[#f0d9b5]'
          }`}
        >
          {formatTime(displayTime)}
        </div>
      </div>
    </div>
  )
}
