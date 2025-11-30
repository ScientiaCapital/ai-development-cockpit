import { redirect } from 'next/navigation'

/**
 * Legacy dashboard route - redirects to home page
 *
 * The new Consumer SaaS layout lives at / (root)
 * This redirect ensures old bookmarks and links still work
 */
export default function DashboardPage() {
  redirect('/')
}
