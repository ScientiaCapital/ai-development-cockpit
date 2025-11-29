# Consumer SaaS Design - AI Development Cockpit

**Date**: 2025-11-29
**Status**: Approved
**Target Users**: Non-coders (family, beginners) who want to build apps

---

## Design Summary

Transform AI Development Cockpit into a consumer-friendly SaaS with:
- Sidebar layout (like Claude Code)
- GitHub integration during project creation
- Theme switcher (arcade/enterprise)
- Cloud storage via Supabase free tier

---

## Layout Architecture

### Sidebar + Main Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ AI Dev Cockpit                         [Select repo ▼] [Theme ▼]    │
├──────────────────────┬──────────────────────────────────────────────┤
│                      │                                              │
│  Projects    Active▼ │              Quick Actions                   │
│                      │                                              │
│  ┌────────────────┐  │    ┌─────────────┐  ┌─────────────┐         │
│  │ Todo App       │  │    │ New Project │  │ Continue    │         │
│  │ user/todo-app  │  │    │             │  │ Last        │         │
│  └────────────────┘  │    └─────────────┘  └─────────────┘         │
│                      │                                              │
│  ┌────────────────┐  │    ┌─────────────┐  ┌─────────────┐         │
│  │ Weather API    │  │    │ Import from │  │ Browse      │         │
│  │ Draft          │  │    │ GitHub      │  │ Templates   │         │
│  └────────────────┘  │    └─────────────┘  └─────────────┘         │
│                      │                                              │
│  [+ New Project]     │                                              │
│                      │                                              │
├──────────────────────┴──────────────────────────────────────────────┤
│ 👤 Username                                              ⚙ Settings │
└─────────────────────────────────────────────────────────────────────┘
```

### Route Structure

```
src/app/
├── (app)/                     # Main app with sidebar layout
│   ├── layout.tsx             # SidebarLayout component
│   ├── page.tsx               # Dashboard with quick actions
│   ├── projects/[id]/         # Project detail/chat view
│   └── settings/              # User settings
├── (auth)/                    # Auth pages (no sidebar)
│   ├── layout.tsx
│   ├── login/
│   └── callback/
└── layout.tsx                 # Root (providers only)
```

---

## Theme System

### Tailwind Theme Classes

Add to `globals.css`:

```css
/* Arcade Theme - Terminal green */
.theme-arcade {
  --background: 10 10 10;
  --foreground: 0 255 0;
  --card: 26 26 26;
  --card-foreground: 0 255 0;
  --primary: 0 255 0;
  --primary-foreground: 0 0 0;
  --muted: 38 38 38;
  --muted-foreground: 0 200 0;
  --border: 0 100 0;
}

/* Enterprise Theme - Professional blue */
.theme-enterprise {
  --background: 255 255 255;
  --foreground: 31 41 55;
  --card: 249 250 251;
  --card-foreground: 31 41 55;
  --primary: 59 130 246;
  --primary-foreground: 255 255 255;
  --muted: 243 244 246;
  --muted-foreground: 107 114 128;
  --border: 229 231 235;
}

/* Dark variant for enterprise */
.dark.theme-enterprise {
  --background: 17 24 39;
  --foreground: 243 244 246;
  --card: 31 41 55;
  --primary: 96 165 250;
}
```

### Theme Switcher Component

Store preference in:
1. localStorage (immediate)
2. Supabase profiles.theme_preference (persist across devices)

---

## Database Schema

### Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'building', 'ready', 'deployed', 'failed')),
  user_request TEXT,
  github_repo_url TEXT,
  github_repo_full_name TEXT,
  total_cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users see only their projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_projects_user_id ON projects(user_id);
```

### Project Builds Table

```sql
CREATE TABLE project_builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  build_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'success', 'failed')),
  cost_usd DECIMAL(10,6) DEFAULT 0,
  duration_ms INTEGER,
  agent_outputs JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS: Access through project ownership
ALTER TABLE project_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own project builds" ON project_builds
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "System creates builds" ON project_builds
  FOR INSERT WITH CHECK (true);
```

### Profile Updates

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'arcade',
  ADD COLUMN IF NOT EXISTS github_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
```

---

## GitHub Integration

### OAuth Scope

Request `repo` scope for full repository access (public and private).

### Flow

1. User clicks "Select repository" dropdown
2. If not connected → "Connect GitHub" button
3. OAuth flow → store token securely
4. Dropdown populates with user's repos
5. User selects existing repo OR creates new one
6. On build complete → auto-push code to repo

### GitHubService Methods

```typescript
interface GitHubService {
  isConnected(): boolean
  connect(): Promise<void>              // OAuth redirect
  listRepos(): Promise<Repo[]>          // GET /user/repos
  createRepo(name: string, isPrivate: boolean): Promise<Repo>
  pushFiles(repo: string, files: File[], message: string): Promise<void>
}
```

---

## Components to Build

### Layout Components

| Component | Purpose |
|-----------|---------|
| `SidebarLayout.tsx` | Main app layout with sidebar |
| `Sidebar.tsx` | Project list, new project button |
| `TopBar.tsx` | Logo, repo selector, theme toggle |
| `UserMenu.tsx` | Avatar, settings link, sign out |

### Project Components

| Component | Purpose |
|-----------|---------|
| `ProjectList.tsx` | Sidebar project list |
| `ProjectCard.tsx` | Single project in sidebar |
| `QuickActions.tsx` | Dashboard action cards |
| `CreateProjectModal.tsx` | New project form |
| `RepoSelector.tsx` | GitHub repo dropdown |

### Theme Components

| Component | Purpose |
|-----------|---------|
| `ThemeSwitcher.tsx` | Arcade/Enterprise toggle |
| `ThemePreview.tsx` | Visual preview of theme |

---

## User Flows

### New User Flow

1. User visits site → sees login page
2. Clicks "Sign in with GitHub" → OAuth with `repo` scope
3. Redirects to dashboard → sees quick actions
4. GitHub already connected (from OAuth)
5. Clicks "New Project" → create project modal
6. Selects/creates repo, describes app → starts building

### Returning User Flow

1. User visits site → auto-logged in (session)
2. Sees dashboard with project list in sidebar
3. Clicks project → opens project detail/chat
4. Or clicks "New Project" to start fresh

### Theme Switch Flow

1. User clicks theme toggle in top bar
2. Theme switches immediately (localStorage)
3. Preference saves to Supabase (background)
4. On next visit, theme loads from Supabase

---

## File Structure

```
src/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx           # SidebarLayout
│   │   ├── page.tsx             # Dashboard
│   │   ├── projects/
│   │   │   └── [id]/page.tsx    # Project detail
│   │   └── settings/page.tsx    # Settings
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── callback/page.tsx
│   ├── globals.css              # Theme CSS variables
│   └── layout.tsx               # Root providers
├── components/
│   ├── layout/
│   │   ├── SidebarLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── UserMenu.tsx
│   ├── projects/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── CreateProjectModal.tsx
│   │   └── RepoSelector.tsx
│   ├── dashboard/
│   │   └── QuickActions.tsx
│   └── theme/
│       └── ThemeSwitcher.tsx
├── services/
│   ├── projects/
│   │   └── ProjectsService.ts
│   └── github/
│       └── GitHubService.ts
└── types/
    └── projects.ts
```

---

## Success Criteria

- [ ] Sidebar shows user's projects
- [ ] Quick action cards on dashboard
- [ ] Theme switches between arcade/enterprise
- [ ] GitHub repos populate in dropdown
- [ ] New project creates repo and saves to Supabase
- [ ] Projects persist across sessions
- [ ] Mobile responsive (sidebar collapses)

---

## Implementation Order

1. **SidebarLayout + TopBar** - Foundation
2. **Theme system** - CSS variables + switcher
3. **Database migration** - Projects + builds tables
4. **ProjectsService** - CRUD operations
5. **Sidebar + ProjectList** - Display projects
6. **CreateProjectModal + RepoSelector** - GitHub integration
7. **Dashboard QuickActions** - Entry points
8. **Polish** - Loading states, empty states, errors
