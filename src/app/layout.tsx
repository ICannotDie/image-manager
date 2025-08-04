import type { Metadata } from 'next'
import './global.css'

export const metadata: Metadata = {
  title: 'Image Manager',
  description: 'Local image vector search application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  )
} 