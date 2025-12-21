import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { tasks } from "@/lib/data"

interface TodaysJobsProps {
  className?: string
}

export function TodaysJobs({ className }: TodaysJobsProps) {
  // Get today's jobs (scheduled or in_progress)
  const todaysTasks = tasks.filter(
    task => task.status === 'scheduled' || task.status === 'in_progress'
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Today&apos;s Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        {todaysTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs scheduled for today</p>
        ) : (
          <div className="space-y-4">
            {todaysTasks.map(task => (
              <div key={task.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {task.description}
                  </p>
                </div>
                <Badge
                  variant={task.status === 'in_progress' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {task.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
