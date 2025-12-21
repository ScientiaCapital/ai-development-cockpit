import Link from "next/link"
import { TodaysJobs } from "@/components/dashboard/TodaysJobs"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { RecentActivity } from "@/components/dashboard/RecentActivity"

interface DashboardPageProps {
  searchParams: {
    trade?: string
  }
}

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  const { trade } = searchParams
  const tradeTitle = trade ? trade.toUpperCase() : ''

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {tradeTitle ? `${tradeTitle} Dashboard` : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          Welcome to your Contractor Command Center
        </p>
      </div>

      {/* Navigation Links */}
      <div className="flex gap-4 border-b pb-4">
        <Link
          href={`/templates${trade ? `?trade=${trade}` : ''}`}
          className="text-sm hover:underline"
        >
          Templates
        </Link>
        <Link
          href={`/jobs${trade ? `?trade=${trade}` : ''}`}
          className="text-sm hover:underline"
        >
          Jobs
        </Link>
        <Link
          href="/customers"
          className="text-sm hover:underline"
        >
          Customers
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Jobs - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <TodaysJobs />
        </div>

        {/* Quick Actions - 1 column */}
        <div>
          <QuickActions trade={trade} />
        </div>

        {/* Recent Activity - Full width below */}
        <div className="lg:col-span-3">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
