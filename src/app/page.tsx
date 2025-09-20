import { redirect } from 'next/navigation'

export default function HomePage() {
  // This will be handled by middleware, but this serves as a fallback
  redirect('/swaggystacks')
}