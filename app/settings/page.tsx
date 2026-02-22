import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')
  return <SettingsClient />
}
