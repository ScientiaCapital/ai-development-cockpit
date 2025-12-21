import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JobStatusBadge } from './JobStatusBadge'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin } from 'lucide-react'

interface JobCardProps {
  job: {
    id: string
    title: string
    description: string
    status: 'scheduled' | 'in_progress' | 'completed'
    priority: 'low' | 'medium' | 'high'
    startDate: string
    siteId: string
  }
  siteName?: string
  customerName?: string
}

export function JobCard({ job, siteName, customerName }: JobCardProps) {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }

  const startDate = new Date(job.startDate)
  const formattedDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <JobStatusBadge status={job.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {job.description}
          </p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </div>

          {siteName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {siteName}
            </div>
          )}

          {customerName && (
            <p className="text-sm font-medium">{customerName}</p>
          )}

          <Badge className={priorityColors[job.priority]}>
            {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)} Priority
          </Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
