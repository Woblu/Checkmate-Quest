import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import PuzzlePlayClient from './PuzzlePlayClient'

export default async function PuzzlePlayPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')
  return <PuzzlePlayClient />
}
