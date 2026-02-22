import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import PlayGameClient from './PlayGameClient'

export default async function GamePage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')
  return <PlayGameClient />
}
