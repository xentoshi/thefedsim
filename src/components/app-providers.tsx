'use client'

import React from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { ReactQueryProvider } from './react-query-provider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
