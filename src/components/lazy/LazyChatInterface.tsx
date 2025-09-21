'use client'

import { createLazyComponent, ChatPageFallback } from '@/utils/lazyLoading'

// Lazy load the chat page component
export const LazyChatInterface = createLazyComponent(
  () => import('@/app/chat/page').then(module => ({ default: module.default })),
  ChatPageFallback
)