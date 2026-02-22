import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import PlayBotClient from './PlayBotClient'

export default async function PlayBotPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')
  return <PlayBotClient />
}
