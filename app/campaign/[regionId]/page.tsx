import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import TournamentBracketClient from './TournamentBracketClient'

export default async function TournamentBracketPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')
  return <TournamentBracketClient />
}
