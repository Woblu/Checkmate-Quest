import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import CampaignClient from './CampaignClient'

export default async function CampaignPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')
  return <CampaignClient />
}
