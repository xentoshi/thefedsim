import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/app-providers'
import React from 'react'

export const metadata: Metadata = {
  title: 'The Fed Simulator',
  description: 'Act as Jerome Powell and influence the markets in real time',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}

declare global {
  interface BigInt { toJSON(): string }
}
BigInt.prototype.toJSON = function () { return this.toString() }
