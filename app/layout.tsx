import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UN Document Diff Viewer',
  description: 'Compare and diff UN documents with highlighted changes',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
