import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { tasks } from "@/lib/data"

interface RecentActivityProps {
  className?: string
}

export function RecentActivity({ className }: RecentActivityProps) {
  // Get recent completed tasks
  const recentTasks = tasks
    .filter(task => task.status === 'completed')
    .slice(0, 5)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recentTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentTasks.map(task => (
              <div key={task.id} className="flex items-start border-b pb-3 last:border-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Completed • {new Date(task.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
