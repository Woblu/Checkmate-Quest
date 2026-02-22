import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import Navbar from '@/components/Navbar'
import SocialWidget from '@/components/SocialWidget'

export const metadata: Metadata = {
  title: 'Chessler - Play & Rank',
  description: 'Chess ranking and statistics dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Navbar />
          {children}
          <SocialWidget />
        </body>
      </html>
    </ClerkProvider>
  )
}
