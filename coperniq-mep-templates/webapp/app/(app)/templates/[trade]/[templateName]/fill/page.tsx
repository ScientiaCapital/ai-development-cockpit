'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Send } from 'lucide-react'
import { APITemplate, APITemplateField, APITemplateGroup } from '@/lib/api'

export default function FillFormPage() {
  const params = useParams()
  const trade = params.trade as string
  const templateName = params.templateName as string

  const [template, setTemplate] = useState<APITemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await fetch(`/api/templates/${trade}/${templateName}`)
        if (res.ok) {
          const data = await res.json()
          setTemplate(data)
        }
      } catch (error) {
        console.error('Failed to load template:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTemplate()
  }, [trade, templateName])

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Form submitted:', formData)
    setSubmitting(false)
    alert('Form submitted successfully!')
  }

  const renderField = (field: APITemplateField) => {
    const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_')

    switch (field.type) {
      case 'Text':
        return (
          <Input
            id={fieldKey}
            value={formData[fieldKey] || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        )

      case 'Numeric':
        return (
          <Input
            id={fieldKey}
            type="number"
            value={formData[fieldKey] || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            placeholder="0"
          />
        )

      case 'Single select':
        return (
          <Select
            value={formData[fieldKey] || ''}
            onValueChange={(value) => handleInputChange(fieldKey, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'Multiple select':
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((option) => (
              <Badge
                key={option}
                variant={formData[fieldKey]?.includes(option) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  const current = formData[fieldKey]?.split(',').filter(Boolean) || []
                  const newValue = current.includes(option)
                    ? current.filter(v => v !== option)
                    : [...current, option]
                  handleInputChange(fieldKey, newValue.join(','))
                }}
              >
                {option}
              </Badge>
            ))}
          </div>
        )

      case 'File':
        return (
          <Input
            id={fieldKey}
            type="file"
            className="cursor-pointer"
          />
        )

      default:
        return (
          <Input
            id={fieldKey}
            value={formData[fieldKey] || ''}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coperniq-primary" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p>Template not found</p>
        <Link href="/templates">
          <Button variant="outline" className="mt-4">Back to Templates</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/templates/${trade}/${templateName}`}>
            <Button variant="ghost" className="mb-4 -ml-4">
              ← Back to Template
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{template.emoji}</span>
            <h1 className="text-xl font-semibold text-gray-900">
              {template.name}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Fill out the form below to create a new submission
          </p>
        </div>

        {/* Form Groups */}
        <div className="space-y-4 mb-6">
          {template.groups?.map((group: APITemplateGroup) => (
            <Card key={group.name}>
              <CardHeader className="py-3 pb-2">
                <CardTitle className="text-base">{group.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.fields.map((field: APITemplateField) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name.toLowerCase().replace(/\s+/g, '_')}>
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 sticky bottom-0 bg-gray-50 py-4 border-t">
          <Button variant="outline" className="flex-1" disabled={submitting}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            className="flex-1 bg-coperniq-primary hover:bg-coperniq-primary-hover"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}
