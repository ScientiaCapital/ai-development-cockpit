import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTemplate } from '@/lib/templates-data'

interface TemplateDetailPageProps {
  params: Promise<{
    trade: string
    templateName: string
  }>
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { trade, templateName } = await params
  const template = getTemplate(trade, templateName)

  if (!template) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/templates">
            <Button variant="ghost" className="mb-4 -ml-4">
              ← Back to Templates
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{template.emoji}</span>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {template.name}
              </h1>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="bg-coperniq-primary/10 text-coperniq-primary">
                  {template.trade.toUpperCase()}
                </Badge>
                <Badge variant="outline">{template.fields_count} fields</Badge>
                <Badge variant="outline">{template.groups_count} sections</Badge>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground">
            {template.description}
          </p>
        </div>

        {/* Groups Preview */}
        {template.groups && template.groups.length > 0 && (
          <div className="space-y-4 mb-6">
            {template.groups.map((group) => (
              <Card key={group.name}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">{group.name}</CardTitle>
                  <CardDescription>{group.fields.length} fields</CardDescription>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-2">
                    {group.fields.map((field) => (
                      <div
                        key={field.name}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{field.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {field.type}
                            {field.required && ' • Required'}
                          </div>
                        </div>
                        {field.options && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {field.options.length} options
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link href={`/templates/${trade}/${templateName}/fill`} className="flex-1">
            <Button className="w-full bg-coperniq-primary hover:bg-coperniq-primary-hover" size="lg">
              Fill This Form
            </Button>
          </Link>
          <Button variant="outline" size="lg">
            Push to Coperniq
          </Button>
        </div>
      </div>
    </div>
  )
}
