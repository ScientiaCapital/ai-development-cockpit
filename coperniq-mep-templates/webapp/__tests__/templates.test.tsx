import { render, screen } from '@testing-library/react'
import TemplatesPage from '@/app/templates/page'
import TemplateDetailPage from '@/app/templates/[id]/page'

describe('Templates Browser', () => {
  it('shows template grid', async () => {
    const searchParams = { trade: 'hvac' }
    const component = await TemplatesPage({ searchParams })
    render(component)
    expect(screen.getByRole('heading', { name: /Templates/i })).toBeInTheDocument()
  })

  it('filters by trade', async () => {
    const searchParams = { trade: 'hvac' }
    const component = await TemplatesPage({ searchParams })
    render(component)
    expect(screen.getByText(/AC System Inspection/i)).toBeInTheDocument()
  })

  it('shows template cards with name and description', async () => {
    const searchParams = { trade: 'hvac' }
    const component = await TemplatesPage({ searchParams })
    render(component)
    const cards = screen.getAllByRole('article')
    expect(cards.length).toBeGreaterThan(0)
  })
})

describe('Template Detail', () => {
  it('shows template name', async () => {
    const params = { id: 'ac_inspection' }
    const component = await TemplateDetailPage({ params })
    render(component)
    expect(screen.getByText(/AC.*Inspection/i)).toBeInTheDocument()
  })

  it('has fill form button', async () => {
    const params = { id: 'ac_inspection' }
    const component = await TemplateDetailPage({ params })
    render(component)
    expect(screen.getByRole('link', { name: /Fill.*Form/i })).toBeInTheDocument()
  })
})
