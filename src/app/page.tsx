import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to the AI chat interface - the main feature
  redirect('/chat')
}