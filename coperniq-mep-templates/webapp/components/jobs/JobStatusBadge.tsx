import { Badge } from '@/components/ui/badge'

interface JobStatusBadgeProps {
  status: 'scheduled' | 'in_progress' | 'completed'
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const variants = {
    scheduled: 'secondary',
    in_progress: 'default',
    completed: 'outline',
  } as const

  const labels = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
  }

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  )
}
