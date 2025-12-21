import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTrades, getTemplatesByTrade, getAllTemplates, Template } from '@/lib/templates-data'

interface TemplatesPageProps {
  searchParams: {
    trade?: string
    search?: string
  }
}

function TemplateCard({ template }: { template: Template }) {
  const templateSlug = template.slug || template.file.replace('.yaml', '')
  return (
    <Link href={`/templates/${template.trade}/${templateSlug}`}>
      <Card className="h-full hover:shadow-lg hover:border-coperniq-primary/50 transition-all cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <span className="text-2xl">{template.emoji}</span>
            <Badge variant="outline" className="text-xs">
              {template.trade.toUpperCase()}
            </Badge>
          </div>
          <CardTitle className="text-lg mt-2">{template.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {template.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{template.fields_count} fields</span>
            <span>•</span>
            <span>{template.groups_count} sections</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const params = await searchParams
  const selectedTrade = params.trade || 'all'

  // Load from static JSON
  const tradesData = getTrades()
  const trades = tradesData.map(t => ({ trade: t.trade, count: t.count }))

  let templates: Template[] = []
  if (selectedTrade === 'all') {
    templates = getAllTemplates()
  } else {
    templates = getTemplatesByTrade(selectedTrade)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Templates
          </h1>
          <p className="text-muted-foreground">
            {templates.length} templates across {trades.length} trades
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Trade Filter */}
          <div className="flex gap-2 flex-wrap">
            <Link href="/templates?trade=all">
              <Button
                variant={selectedTrade === 'all' ? 'default' : 'outline'}
                className={selectedTrade === 'all' ? 'bg-coperniq-primary hover:bg-coperniq-primary-hover' : ''}
              >
                All ({trades.reduce((sum, t) => sum + t.count, 0)})
              </Button>
            </Link>
            {trades.map((t) => (
              <Link key={t.trade} href={`/templates?trade=${t.trade}`}>
                <Button
                  variant={selectedTrade === t.trade ? 'default' : 'outline'}
                  className={selectedTrade === t.trade ? 'bg-coperniq-primary hover:bg-coperniq-primary-hover' : ''}
                >
                  {t.trade.replace('_', ' ').toUpperCase()} ({t.count})
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        {templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map((template) => (
              <TemplateCard key={`${template.trade}-${template.file}`} template={template} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No templates found for this trade.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
