import { JobCard } from '@/components/jobs/JobCard'
import { tasks, getSiteById, getContactBySiteId } from '@/lib/data'

export default function JobsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Jobs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => {
          const site = getSiteById(task.siteId)
          const contact = getContactBySiteId(task.siteId)

          return (
            <JobCard
              key={task.id}
              job={{
                ...task,
                status: task.status as 'scheduled' | 'in_progress' | 'completed',
                priority: task.priority as 'low' | 'medium' | 'high'
              }}
              siteName={site?.fullAddress}
              customerName={contact?.name}
            />
          )
        })}
      </div>
    </div>
  )
}
