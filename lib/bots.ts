export interface BotProfile {
  id: string
  name: string
  elo?: number
  skillLevel?: number
  depth: number
  description: string
}

export const BOT_PROFILES: BotProfile[] = [
  {
    id: 'beginner',
    name: 'Beginner Bot',
    skillLevel: 1,
    depth: 1,
    description: 'Perfect for learning the basics. Makes simple moves.',
  },
  {
    id: 'intermediate',
    name: 'Intermediate Bot',
    elo: 1500,
    depth: 5,
    description: 'A solid opponent for improving players. Good tactical awareness.',
  },
  {
    id: 'grandmaster',
    name: 'Grandmaster Bot',
    elo: 2500,
    depth: 15,
    description: 'Extremely strong. Challenges even expert players.',
  },
]

/**
 * Sets the Stockfish engine difficulty based on bot profile
 */
export function setEngineDifficulty(
  sendCommand: (command: string) => void,
  bot: BotProfile
): void {
  if (bot.elo !== undefined) {
    // Use ELO-based strength limiting
    sendCommand('setoption name UCI_LimitStrength value true')
    sendCommand(`setoption name UCI_Elo value ${bot.elo}`)
  } else if (bot.skillLevel !== undefined) {
    // Use skill level for weaker bots
    sendCommand(`setoption name Skill Level value ${bot.skillLevel}`)
  }
  
  // Ensure we're ready
  sendCommand('isready')
}
