import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getTaskById,
  getSiteById,
  getContactBySiteId,
  getAssetById
} from '@/lib/data'
import { Calendar, MapPin, Wrench, User } from 'lucide-react'
import { notFound } from 'next/navigation'

interface JobDetailPageProps {
  params: {
    id: string
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const job = getTaskById(params.id)

  if (!job) {
    notFound()
  }

  const site = getSiteById(job.siteId)
  const contact = getContactBySiteId(job.siteId)
  const asset = job.assetId ? getAssetById(job.assetId) : null

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }

  const startDate = new Date(job.startDate)
  const endDate = new Date(job.endDate)
  const formattedStartDate = startDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const formattedEndDate = endDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
          <div className="flex items-center gap-3">
            <JobStatusBadge status={job.status as 'scheduled' | 'in_progress' | 'completed'} />
            <Badge className={priorityColors[job.priority as keyof typeof priorityColors]}>
              {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)} Priority
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button>Complete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{job.description}</p>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">Start</p>
                <p className="text-muted-foreground">{formattedStartDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium">End</p>
                <p className="text-muted-foreground">{formattedEndDate}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          {contact && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  {contact.title && (
                    <p className="text-sm text-muted-foreground">{contact.title}</p>
                  )}
                </div>
                {contact.emails && contact.emails.length > 0 && (
                  <p className="text-sm text-muted-foreground">{contact.emails[0]}</p>
                )}
                {contact.phones && contact.phones.length > 0 && (
                  <p className="text-sm text-muted-foreground">{contact.phones[0]}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Site Info */}
          {site && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{site.fullAddress}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {site.type.charAt(0).toUpperCase() + site.type.slice(1)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Equipment Info */}
          {asset && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Equipment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium">{asset.name}</p>
                  {asset.manufacturer && (
                    <p className="text-sm text-muted-foreground">
                      {asset.manufacturer} {asset.model}
                    </p>
                  )}
                </div>
                {asset.serialNumber && (
                  <p className="text-sm text-muted-foreground">
                    SN: {asset.serialNumber}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
