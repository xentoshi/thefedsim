import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { FedSimTickerWrapper } from '@/components/fedsim/fedsim-ticker-wrapper'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <FedSimTickerWrapper />
      <div className="min-h-screen">
        {children}
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
