import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'School CTF Platform',
  description: 'Cybersecurity Capture The Flag challenges for students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

