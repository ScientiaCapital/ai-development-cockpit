# Tech Stack and Code Conventions

## TypeScript Configuration
- **Strict mode enabled** with comprehensive type checking
- **Base URL mapping** with `@/*` paths for clean imports
- **ES2017 target** with modern JS features
- **Module resolution**: bundler (Next.js optimized)
- **Incremental compilation** enabled for performance

## Code Organization
```
src/
├── types/           # TypeScript definitions and interfaces
├── components/      # React components (UI, auth, terminal, etc.)
├── app/            # Next.js 14 app router pages
├── services/       # Business logic and API clients  
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and configurations
├── contexts/       # React context providers
├── providers/      # Higher-order providers
├── utils/          # General utilities
└── styles/         # CSS modules and global styles
```

## Naming Conventions
- **Components**: PascalCase (e.g., `ModernChatInterface.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useInference.ts`)
- **Services**: camelCase with service suffix (e.g., `monitoring.service.ts`)
- **Types**: PascalCase interfaces and types (e.g., `DeploymentConfiguration`)
- **Files**: kebab-case for routes, camelCase for components

## Type Safety Patterns
- **Strict interfaces** for all API responses and requests
- **Union types** for status and configuration enums
- **Generic types** for reusable components and services
- **Utility types** (Partial, Required, Pick) for flexible interfaces
- **Branded types** for ID and handle validation

## Component Architecture
- **Functional components** with TypeScript
- **Custom hooks** for stateful logic separation
- **Context providers** for global state management
- **Compound components** for complex UI patterns
- **Error boundaries** for robust error handling