import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Building2 } from 'lucide-react'

interface CustomerCardProps {
  customer: {
    id: string
    name: string
    emails?: string[]
    phones?: string[]
    title?: string
    status: string
    source: string
  }
  siteCount?: number
}

export function CustomerCard({ customer, siteCount }: CustomerCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  }

  return (
    <Link href={`/customers/${customer.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{customer.name}</CardTitle>
              {customer.title && (
                <p className="text-sm text-muted-foreground">{customer.title}</p>
              )}
            </div>
            <Badge className={statusColors[customer.status as keyof typeof statusColors] || statusColors.inactive}>
              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {customer.emails && customer.emails.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {customer.emails[0]}
            </div>
          )}

          {customer.phones && customer.phones.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {customer.phones[0]}
            </div>
          )}

          {siteCount !== undefined && siteCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {siteCount} {siteCount === 1 ? 'Site' : 'Sites'}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
