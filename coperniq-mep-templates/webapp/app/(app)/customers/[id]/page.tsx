import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JobCard } from '@/components/jobs/JobCard'
import {
  getContactById,
  getSitesForContact,
  getTasksForContact,
  getAssetsForContact,
  getSiteById
} from '@/lib/data'
import { Mail, Phone, MapPin, Building2 } from 'lucide-react'
import { notFound } from 'next/navigation'

interface CustomerDetailPageProps {
  params: {
    id: string
  }
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const customer = getContactById(params.id)

  if (!customer) {
    notFound()
  }

  const sites = getSitesForContact(customer.id)
  const jobs = getTasksForContact(customer.id)
  const assets = getAssetsForContact(customer.id)

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{customer.name}</h1>
          <div className="flex items-center gap-3">
            <Badge className={statusColors[customer.status as keyof typeof statusColors] || statusColors.inactive}>
              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
            </Badge>
            {customer.title && (
              <span className="text-muted-foreground">{customer.title}</span>
            )}
          </div>
        </div>
        <Button>Edit Customer</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Jobs Section */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold tracking-tight">Jobs</h2>
            </CardHeader>
            <CardContent>
              {jobs.length > 0 ? (
                <div className="grid gap-4">
                  {jobs.slice(0, 5).map((job) => {
                    const site = getSiteById(job.siteId)
                    return (
                      <JobCard
                        key={job.id}
                        job={{
                          ...job,
                          status: job.status as 'scheduled' | 'in_progress' | 'completed',
                          priority: job.priority as 'low' | 'medium' | 'high'
                        }}
                        siteName={site?.fullAddress}
                      />
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No jobs found</p>
              )}
            </CardContent>
          </Card>

          {/* Sites Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Sites ({sites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sites.length > 0 ? (
                <div className="space-y-3">
                  {sites.map((site) => (
                    <div
                      key={site.id}
                      className="border rounded-lg p-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{site.fullAddress}</p>
                          <p className="text-sm text-muted-foreground">
                            {site.type.charAt(0).toUpperCase() + site.type.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No sites found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.emails && customer.emails.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${customer.emails[0]}`}
                    className="text-blue-600 hover:underline"
                  >
                    {customer.emails[0]}
                  </a>
                </div>
              )}

              {customer.phones && customer.phones.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${customer.phones[0]}`}
                    className="text-blue-600 hover:underline"
                  >
                    {customer.phones[0]}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Jobs</span>
                <span className="font-semibold">{jobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sites</span>
                <span className="font-semibold">{sites.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equipment</span>
                <span className="font-semibold">{assets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="font-semibold">
                  {customer.source.split('_').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
