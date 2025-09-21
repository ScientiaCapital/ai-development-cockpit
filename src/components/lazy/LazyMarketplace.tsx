'use client'

import { createLazyComponent, MarketplaceFallback } from '@/utils/lazyLoading'

// Lazy load the marketplace component
export const LazyMarketplace = createLazyComponent(
  () => import('@/app/marketplace/page').then(module => ({ default: module.default })),
  MarketplaceFallback
)