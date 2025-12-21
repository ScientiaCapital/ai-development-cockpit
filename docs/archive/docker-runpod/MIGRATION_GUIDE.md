# 🔄 Type System Migration Guide

**Purpose**: Consolidate multiple conflicting `Organization` type definitions into a single source of truth.

**Estimated Time**: 4-6 hours
**Difficulty**: Medium
**Status**: Centralized types created in `src/types/organization.ts`

---

## 📊 Current State Analysis

### **Problem**: Multiple Conflicting Organization Types

```typescript
// ❌ CURRENT PROBLEM - Same name, different definitions

// File: src/contexts/HuggingFaceAuth.tsx
export type Organization = 'arcade' | 'enterprise'  // String literal

// File: src/lib/organization.ts
export interface Organization {  // Full entity
  id: string
  name: string
  slug: string
  // ... 20 more fields
}

// File: src/lib/organizations.ts
export type Organization = Tables<'organizations'>  // Supabase type

// File: src/services/monitoring/prometheus.service.ts
export type Organization = 'arcade' | 'enterprise' | 'shared'  // Different strings
```

**Result**: TypeScript can't distinguish which `Organization` to use, causing 30+ compilation errors.

---

## ✅ Solution: Centralized Type System

**Created**: `src/types/organization.ts` (301 lines)

### **New Type Hierarchy**

```typescript
// ✅ NEW SYSTEM - Clear, distinct names

// 1. For identifiers/slugs (routing, API calls)
export type OrganizationSlug = 'arcade' | 'enterprise'

// 2. For full database entities (CRUD operations)
export interface OrganizationEntity {
  id: string
  name: string
  slug: string
  // ... all database fields
}

// 3. For Supabase queries
export type OrganizationRecord = Tables<'organizations'>

// 4. With members (join results)
export interface OrganizationWithMembers extends OrganizationRecord {
  user_organizations: ...
  member_count: number
}
```

---

## 🗺️ Migration Steps

### **Phase 1: Analyze Current Usage** (30 minutes)

Find all files that import Organization:

```bash
# Find all imports
grep -r "import.*Organization" src/ --include="*.ts" --include="*.tsx" | wc -l
# Result: ~50+ files

# Find all exports
grep -r "export.*Organization" src/ --include="*.ts" --include="*.tsx"
```

**Key Question**: Which Organization type is each file using?
- String literal → `OrganizationSlug`
- Full entity → `OrganizationEntity`
- Supabase table → `OrganizationRecord`

### **Phase 2: Update Core Files** (1-2 hours)

#### **Step 1: Update contexts/HuggingFaceAuth.tsx**

```typescript
// BEFORE
export type Organization = 'arcade' | 'enterprise'

// AFTER
import type { OrganizationSlug } from '@/types/organization'
export type Organization = OrganizationSlug  // Re-export for compatibility

// Update all usages in the file
currentOrganization: OrganizationSlug  // was: Organization
```

#### **Step 2: Update lib/organization.ts**

```typescript
// BEFORE
export interface Organization { ... }

// AFTER
import type {
  OrganizationEntity,
  OrganizationSettings,
  OrganizationMember,
  OrganizationInvitation
} from '@/types/organization'

export type Organization = OrganizationEntity  // Re-export for compatibility

// Update function signatures
export const getUserOrganizations = async (): Promise<{
  organizations: OrganizationEntity[]  // was: Organization[]
  error: Error | null
}> => { ... }
```

#### **Step 3: Update lib/organizations.ts**

```typescript
// BEFORE
export type Organization = Tables<'organizations'>

// AFTER
import type {
  OrganizationRecord,
  OrganizationWithMembers,
  CreateOrganizationData,
  UpdateOrganizationData
} from '@/types/organization'

export type Organization = OrganizationRecord  // Re-export for compatibility
```

### **Phase 3: Update All Imports** (2-3 hours)

Use find-and-replace carefully:

```bash
# Pattern 1: Context imports (string literal usage)
# FIND:    import.*Organization.*from '@/contexts/HuggingFaceAuth'
# REPLACE: import type { OrganizationSlug } from '@/types/organization'

# Pattern 2: Lib imports (entity usage)
# FIND:    import.*Organization.*from '@/lib/organization'
# REPLACE: import type { OrganizationEntity } from '@/types/organization'

# Pattern 3: Organizations imports (record usage)
# FIND:    import.*Organization.*from '@/lib/organizations'
# REPLACE: import type { OrganizationRecord } from '@/types/organization'
```

**Files to Update** (in priority order):

1. **High Priority** (breaks compilation):
   - `src/types/models.ts`
   - `src/types/deployment.ts`
   - `src/hooks/useOrganization.ts`
   - `src/hooks/useOrganizations.ts`

2. **Medium Priority** (used frequently):
   - `src/components/auth/OrganizationSwitcher.tsx`
   - `src/components/auth/OrganizationManager.tsx`
   - `src/services/huggingface/*.ts`
   - `src/services/runpod/*.ts`

3. **Low Priority** (isolated usage):
   - Individual page components
   - API routes
   - Utility files

### **Phase 4: Remove Compatibility Re-exports** (30 minutes)

Once all imports updated, remove compatibility exports:

```typescript
// Remove these from old files:
export type Organization = OrganizationSlug  // ← Delete
export type Organization = OrganizationEntity  // ← Delete
export type Organization = OrganizationRecord  // ← Delete
```

### **Phase 5: Verify & Test** (1 hour)

```bash
# 1. Type check
npm run type-check
# Should have ZERO errors

# 2. Build
npm run build
# Should succeed

# 3. Run tests
npm run test:unit
npm run test:e2e

# 4. Manual testing
npm run dev
# Test organization switching
# Test model deployment
# Test authentication flows
```

---

## 🔍 Detailed File-by-File Migration

### **Priority 1: Type Definition Files**

#### `src/types/models.ts`
```typescript
// BEFORE
import { Organization } from '@/contexts/HuggingFaceAuth'

export interface ModelMetadata {
  organization: Organization  // ← String literal
}

// AFTER
import type { OrganizationSlug } from '@/types/organization'

export interface ModelMetadata {
  organization: OrganizationSlug
}
```

#### `src/types/deployment.ts`
```typescript
// BEFORE
import { Organization } from '@/contexts/HuggingFaceAuth'

export interface DeploymentConfig {
  organization: Organization  // ← String literal
}

// AFTER
import type { OrganizationSlug } from '@/types/organization'

export interface DeploymentConfig {
  organization: OrganizationSlug
}
```

### **Priority 2: Hook Files**

#### `src/hooks/useOrganization.ts`
```typescript
// BEFORE
import { Organization } from '@/lib/organization'

export function useOrganization(orgId: string) {
  const [org, setOrg] = useState<Organization | null>(null)  // ← Full entity
}

// AFTER
import type { OrganizationEntity } from '@/types/organization'

export function useOrganization(orgId: string) {
  const [org, setOrg] = useState<OrganizationEntity | null>(null)
}
```

### **Priority 3: Component Files**

#### `src/components/auth/OrganizationSwitcher.tsx`
```typescript
// BEFORE
import { Organization } from '@/contexts/HuggingFaceAuth'

interface Props {
  organizations: Organization[]  // ← String literals
  current: Organization
  onSwitch: (org: Organization) => void
}

// AFTER
import type { OrganizationSlug } from '@/types/organization'

interface Props {
  organizations: OrganizationSlug[]
  current: OrganizationSlug
  onSwitch: (org: OrganizationSlug) => void
}
```

### **Priority 4: Service Files**

#### `src/services/huggingface/unified-llm.service.ts`
```typescript
// BEFORE
import { Organization } from '@/contexts/HuggingFaceAuth'

async deployModel(config: {
  organization: Organization  // ← String literal
}) { ... }

// AFTER
import type { OrganizationSlug } from '@/types/organization'

async deployModel(config: {
  organization: OrganizationSlug
}) { ... }
```

---

## ⚠️ Common Pitfalls

### **1. Mixing Types**

```typescript
// ❌ WRONG - Mixing slug and entity
function deployModel(org: OrganizationSlug): OrganizationEntity {
  // Can't return entity from slug!
}

// ✅ CORRECT - Fetch entity if needed
async function deployModel(slug: OrganizationSlug): Promise<OrganizationEntity> {
  const entity = await getOrganization(slug)
  return entity
}
```

### **2. Forgetting Type Guards**

```typescript
// ❌ WRONG - No validation
function switchOrg(org: string) {
  setCurrentOrg(org)  // Type error!
}

// ✅ CORRECT - Use type guard
import { isOrganizationSlug } from '@/types/organization'

function switchOrg(org: string) {
  if (isOrganizationSlug(org)) {
    setCurrentOrg(org)  // ✓ Type safe
  }
}
```

### **3. Breaking API Contracts**

```typescript
// ❌ WRONG - Changes API response shape
// Before: { organization: 'arcade' }
// After:  { organization: { id: '...', name: '...' } }

// ✅ CORRECT - Maintain API compatibility
interface APIResponse {
  organization_slug: OrganizationSlug  // Keep string
  organization_details?: OrganizationEntity  // Add entity if needed
}
```

---

## 🧪 Testing Strategy

### **Unit Tests**

```typescript
import { describe, it, expect } from '@jest/globals'
import { isOrganizationSlug, getOrganizationName } from '@/types/organization'

describe('Organization Types', () => {
  it('validates organization slugs', () => {
    expect(isOrganizationSlug('arcade')).toBe(true)
    expect(isOrganizationSlug('invalid')).toBe(false)
  })

  it('returns correct display names', () => {
    expect(getOrganizationName('arcade')).toBe('AI Dev Cockpit')
  })
})
```

### **Integration Tests**

```typescript
describe('Organization Switching', () => {
  it('switches between organizations', async () => {
    const { result } = renderHook(() => useHuggingFaceAuth())

    act(() => {
      result.current.switchOrganization('enterprise')
    })

    expect(result.current.currentOrganization).toBe('enterprise')
  })
})
```

---

## 📋 Checklist

- [ ] **Phase 1**: Analyze current usage (30 min)
  - [ ] Find all Organization imports
  - [ ] Categorize by type (slug/entity/record)
  - [ ] Document affected files

- [ ] **Phase 2**: Update core files (1-2 hours)
  - [ ] Update `contexts/HuggingFaceAuth.tsx`
  - [ ] Update `lib/organization.ts`
  - [ ] Update `lib/organizations.ts`
  - [ ] Run type-check (expect errors)

- [ ] **Phase 3**: Update all imports (2-3 hours)
  - [ ] Update type definition files
  - [ ] Update hook files
  - [ ] Update component files
  - [ ] Update service files
  - [ ] Update API route files

- [ ] **Phase 4**: Remove compatibility exports (30 min)
  - [ ] Remove re-exports from old files
  - [ ] Update any missed references
  - [ ] Run type-check (should pass)

- [ ] **Phase 5**: Test thoroughly (1 hour)
  - [ ] Type check passes
  - [ ] Build succeeds
  - [ ] Unit tests pass
  - [ ] E2E tests pass
  - [ ] Manual testing completed

---

## 💾 Backup Strategy

Before starting migration:

```bash
# 1. Create backup branch
git checkout -b backup/pre-type-migration
git push origin backup/pre-type-migration

# 2. Create migration branch
git checkout -b refactor/organization-types

# 3. Work in small commits
git add src/types/organization.ts
git commit -m "feat: create centralized organization types"

git add src/contexts/HuggingFaceAuth.tsx
git commit -m "refactor: migrate HuggingFaceAuth to centralized types"

# ... etc for each phase
```

---

## 🎯 Success Criteria

Migration is complete when:

- ✅ `npm run type-check` has ZERO errors
- ✅ `npm run build` succeeds
- ✅ All tests pass
- ✅ No `Organization` imports from old locations
- ✅ Only imports from `@/types/organization`
- ✅ Application runs without runtime errors
- ✅ Organization switching works correctly

---

## 📚 Additional Resources

- **Type System Documentation**: See CODEBASE_AUDIT_REPORT.md section "Type Definition Chaos"
- **Testing Guide**: See test files in `tests/`
- **Supabase Types**: See `src/lib/supabase.ts`

---

**Estimated Total Time**: 4-6 hours
**Recommended Approach**: Do this migration in one focused session to avoid confusion.
**Best Time**: Start fresh in the morning when alert.
