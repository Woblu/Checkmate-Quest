import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import LearnOpeningClient from './LearnOpeningClient'

export default async function LearnOpeningPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')
  return <LearnOpeningClient />
}
