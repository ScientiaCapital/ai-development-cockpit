'use client'

import React, { useState } from 'react'
import { SidebarLayout } from '@/components/layout/SidebarLayout'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Dashboard page - main landing after login
 *
 * Shows:
 * - Welcome message
 * - Quick actions grid
 * - Recent activity (future)
 */
export default function DashboardPage() {
  const { user } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Get user's display name
  const displayName = user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'there'

  return (
    <SidebarLayout>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {displayName}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            What would you like to build today?
          </p>
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Quick Actions
          </h2>
          <QuickActions />
        </section>

        {/* Recent Activity - placeholder */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">
              Your recent builds and activity will appear here.
            </p>
          </div>
        </section>

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </SidebarLayout>
  )
}