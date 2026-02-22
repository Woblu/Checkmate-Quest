'use server'

import { Resend } from 'resend'
import ChallengeEmail from '@/components/emails/ChallengeEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendChallengeEmail(
  challengerName: string,
  opponentEmail: string,
  gameId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
      from: 'challenge@yourdomain.com', // Update this to your verified domain
      to: opponentEmail,
      subject: 'Chess Challenge!',
      react: ChallengeEmail({ challengerName, gameId }),
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error.message || 'Failed to send email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending challenge email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}
