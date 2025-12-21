import { CustomerCard } from '@/components/customers/CustomerCard'
import { contacts, getSitesForContact } from '@/lib/data'

export default function CustomersPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Customers</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => {
          const sites = getSitesForContact(contact.id)

          return (
            <CustomerCard
              key={contact.id}
              customer={contact}
              siteCount={sites.length}
            />
          )
        })}
      </div>
    </div>
  )
}
