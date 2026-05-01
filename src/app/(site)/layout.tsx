import { AppLayout } from '@/components/app-layout'

const links = [
  { label: 'Home', path: '/' },
  { label: 'Play', path: '/fedsim' },
]

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout links={links}>{children}</AppLayout>
}
