import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import PuzzlesClient from './PuzzlesClient'

export default async function PuzzlesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')
  return <PuzzlesClient />
}
