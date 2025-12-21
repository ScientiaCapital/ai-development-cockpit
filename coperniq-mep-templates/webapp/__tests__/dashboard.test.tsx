import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

describe('Dashboard', () => {
  it('shows welcome message with trade', () => {
    render(<DashboardPage searchParams={{ trade: 'hvac' }} />)
    expect(screen.getByText(/HVAC Dashboard/i)).toBeInTheDocument()
  })

  it('displays today\'s jobs section', () => {
    render(<DashboardPage searchParams={{ trade: 'hvac' }} />)
    expect(screen.getByText(/Today's Jobs/i)).toBeInTheDocument()
  })

  it('shows quick action buttons', () => {
    render(<DashboardPage searchParams={{ trade: 'hvac' }} />)
    expect(screen.getByRole('button', { name: /New Job/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fill Form/i })).toBeInTheDocument()
  })

  it('displays recent activity section', () => {
    render(<DashboardPage searchParams={{ trade: 'hvac' }} />)
    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument()
  })

  it('shows navigation links', () => {
    render(<DashboardPage searchParams={{ trade: 'hvac' }} />)
    const links = screen.getAllByRole('link')
    const linkTexts = links.map(link => link.textContent)

    expect(linkTexts).toContain('Templates')
    expect(linkTexts).toContain('Jobs')
    expect(linkTexts).toContain('Customers')
  })

  it('defaults to general dashboard when no trade specified', () => {
    render(<DashboardPage searchParams={{}} />)
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })
})
