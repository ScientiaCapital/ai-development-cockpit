import { render, screen } from '@testing-library/react'
import JobsPage from '@/app/jobs/page'
import JobDetailPage from '@/app/jobs/[id]/page'
import CustomersPage from '@/app/customers/page'
import CustomerDetailPage from '@/app/customers/[id]/page'

describe('Jobs List', () => {
  it('shows jobs heading', () => {
    render(<JobsPage />)
    expect(screen.getByText(/Jobs/i)).toBeInTheDocument()
  })

  it('displays job cards from demo data', () => {
    render(<JobsPage />)
    expect(screen.getByText(/Annual AC Maintenance/i)).toBeInTheDocument()
  })

  it('shows job status badges', () => {
    render(<JobsPage />)
    expect(screen.getAllByText(/Scheduled/i).length).toBeGreaterThan(0)
  })
})

describe('Job Detail', () => {
  it('shows job title', async () => {
    const page = await JobDetailPage({ params: { id: 'task-001' } })
    render(page)
    expect(screen.getByText(/Annual AC Maintenance/i)).toBeInTheDocument()
  })

  it('shows customer info', async () => {
    const page = await JobDetailPage({ params: { id: 'task-001' } })
    render(page)
    expect(screen.getByText(/Carlos Martinez/i)).toBeInTheDocument()
  })
})

describe('Customers List', () => {
  it('shows customers heading', () => {
    render(<CustomersPage />)
    expect(screen.getByText(/Customers/i)).toBeInTheDocument()
  })

  it('displays customer cards', () => {
    render(<CustomersPage />)
    expect(screen.getByText(/Carlos Martinez/i)).toBeInTheDocument()
  })
})

describe('Customer Detail', () => {
  it('shows customer name', async () => {
    const page = await CustomerDetailPage({ params: { id: 'contact-001' } })
    render(page)
    expect(screen.getByText(/Carlos Martinez/i)).toBeInTheDocument()
  })

  it('shows related jobs section', async () => {
    const page = await CustomerDetailPage({ params: { id: 'contact-001' } })
    render(page)
    expect(screen.getByRole('heading', { name: /Jobs/i })).toBeInTheDocument()
  })
})
