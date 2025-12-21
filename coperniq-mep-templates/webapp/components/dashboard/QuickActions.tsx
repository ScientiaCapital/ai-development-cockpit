import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface QuickActionsProps {
  className?: string
  trade?: string
}

export function QuickActions({ className, trade }: QuickActionsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link href={`/jobs/new${trade ? `?trade=${trade}` : ''}`} className="block">
          <Button className="w-full" variant="default">
            New Job
          </Button>
        </Link>
        <Link href={`/templates${trade ? `?trade=${trade}` : ''}`} className="block">
          <Button className="w-full" variant="outline">
            Fill Form
          </Button>
        </Link>
        <Link href="/customers" className="block">
          <Button className="w-full" variant="outline">
            View Customers
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
