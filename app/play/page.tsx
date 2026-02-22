import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import PlayLobbyClient from './PlayLobbyClient'

export default async function PlayPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')
  return <PlayLobbyClient />
}
