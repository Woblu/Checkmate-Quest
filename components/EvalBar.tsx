'use client'

interface EvalBarProps {
  evaluation: number | null // in centipawns, positive = white advantage, negative = black advantage
  isMate?: boolean
  mateIn?: number | null // number of moves to mate (positive = white mates, negative = black mates)
}

export default function EvalBar({ evaluation, isMate, mateIn }: EvalBarProps) {
  // Convert evaluation to a percentage for the bar fill
  // Cap at ±10 pawns (1000 centipawns) for visual purposes
  const maxEval = 1000
  const normalizedEval = evaluation !== null ? Math.max(-maxEval, Math.min(maxEval, evaluation)) : 0
  
  // Calculate fill percentage (50% = equal, >50% = white advantage, <50% = black advantage)
  const fillPercentage = 50 + (normalizedEval / maxEval) * 50
  
  // Determine if it's a mate situation
  const showMate = isMate && mateIn !== null && mateIn !== undefined
  
  // Format evaluation display
  const formatEval = () => {
    if (showMate) {
      return `M${Math.abs(mateIn!)}`
    }
    if (evaluation === null) {
      return '--'
    }
    // Convert centipawns to pawns and format
    const pawns = evaluation / 100
    if (pawns >= 0) {
      return `+${pawns.toFixed(1)}`
    }
    return pawns.toFixed(1)
  }

  return (
    <div className="flex flex-col items-center w-12 h-full">
      {/* Evaluation display */}
      <div className="text-xs text-[#b58863] mb-2 font-mono font-semibold">
        {formatEval()}
      </div>
      
      {/* Bar container */}
      <div className="relative flex-1 w-8 bg-[#1a1a1a] rounded-full overflow-hidden border-2 border-[#3d3d3d]">
        {/* White section (top) */}
        <div
          className="absolute top-0 left-0 right-0 bg-white transition-all duration-300"
          style={{
            height: `${fillPercentage}%`,
          }}
        />
        
        {/* Black section (bottom) */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] transition-all duration-300"
          style={{
            height: `${100 - fillPercentage}%`,
          }}
        />
        
        {/* Center line indicator */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[#4a7c59] transform -translate-y-1/2 opacity-50" />
      </div>
      
      {/* Mate indicator */}
      {showMate && (
        <div className={`text-xs font-bold mt-2 ${mateIn! > 0 ? 'text-white' : 'text-[#1a1a1a]'}`}>
          {mateIn! > 0 ? 'White' : 'Black'} Mates
        </div>
      )}
    </div>
  )
}
