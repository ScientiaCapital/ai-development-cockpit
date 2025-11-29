'use client'

import { SidebarLayout } from '@/components/layout/SidebarLayout'

/**
 * Layout for the main app section with sidebar
 *
 * All routes inside (app)/ will use this layout:
 * - Dashboard (/)
 * - Projects (/projects)
 * - Project detail (/projects/[id])
 * - Settings (/settings)
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SidebarLayout>{children}</SidebarLayout>
}
