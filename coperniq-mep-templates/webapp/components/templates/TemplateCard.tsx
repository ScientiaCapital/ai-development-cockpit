import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Template } from '@/lib/templates'

interface TemplateCardProps {
  template: Template
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Link href={`/templates/${template.id}`}>
      <Card
        className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
        role="article"
      >
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{template.emoji}</span>
            <CardTitle className="text-xl">{template.name}</CardTitle>
          </div>
          <CardDescription className="text-sm">
            {template.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">
            {template.fields.length} fields
          </Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
