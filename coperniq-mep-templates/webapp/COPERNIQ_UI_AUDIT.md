# Coperniq UI Audit - Design System Reference

**Audited**: 2025-12-20
**Source**: https://app.coperniq.io/112

---

## Color Palette

### Primary Colors
- **Sidebar Background**: `#1E2433` (dark navy)
- **Main Content Background**: `#FFFFFF` (white)
- **Secondary Background**: `#F8FAFC` (light gray)

### Accent Colors
- **Primary Action**: `#00BFA5` (teal/cyan) - buttons, active states
- **Secondary Action**: `#6366F1` (indigo) - links, hover states
- **Success/Active**: `#10B981` (green) - status badges
- **Warning**: `#F59E0B` (amber) - attention items
- **Danger/Overdue**: `#EF4444` (red) - overdue badges, errors

### Text Colors
- **Primary Text**: `#1F2937` (dark gray)
- **Secondary Text**: `#6B7280` (medium gray)
- **Muted Text**: `#9CA3AF` (light gray)
- **Inverse Text**: `#FFFFFF` (white - on dark backgrounds)

---

## Typography

### Font Family
- **Primary**: Inter (or system sans-serif)
- **Monospace**: JetBrains Mono (for code/IDs)

### Font Sizes
- **Page Title**: 24px, font-weight: 600
- **Section Header**: 18px, font-weight: 600
- **Body Text**: 14px, font-weight: 400
- **Small Text**: 12px, font-weight: 400
- **Badge Text**: 11px, font-weight: 500

---

## Layout Structure

### Sidebar (Left Navigation)
- Width: 240px (expanded), 64px (collapsed)
- Fixed position, full height
- Dark background with light text
- Sections:
  1. Company logo/name (top)
  2. Main navigation links (icons + text)
  3. Hubs section (collapsible groups)
  4. User profile (bottom)

### Main Content Area
- Left margin: 240px (or 64px when sidebar collapsed)
- Padding: 24px
- Max-width: none (full width)

### Page Header
- Sticky at top
- Contains: Title, search, filters, action buttons
- Border-bottom: 1px solid #E5E7EB

---

## Components

### Navigation Item (Sidebar)
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 8px;
  color: #9CA3AF;
  transition: all 0.2s;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
}
.nav-item.active {
  background: rgba(0, 191, 165, 0.2);
  color: #00BFA5;
}
```

### Card
```css
.card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### Table Row
```css
.table-row {
  display: grid;
  grid-template-columns: 40px 1fr 150px 100px 120px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #F3F4F6;
}
.table-row:hover {
  background: #F9FAFB;
}
```

### Status Badge
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}
.badge-active { background: #ECFDF5; color: #059669; }
.badge-scheduled { background: #EFF6FF; color: #2563EB; }
.badge-overdue { background: #FEF2F2; color: #DC2626; }
.badge-welcome { background: #E0F2FE; color: #0284C7; }
```

### Button
```css
.btn-primary {
  background: #00BFA5;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-primary:hover {
  background: #00A896;
}
.btn-secondary {
  background: white;
  border: 1px solid #E5E7EB;
  color: #374151;
  padding: 8px 16px;
  border-radius: 6px;
}
```

### Filter Dropdown
```css
.filter-dropdown {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
}
```

---

## Key UI Patterns

### 1. Workflow Tabs
- Horizontal tabs showing project phases
- Each tab shows count in parentheses
- Active tab has bottom border accent

### 2. Kanban-Style Grouping
- Work items grouped by status (Open, In Progress, Closed)
- Collapsible sections with count
- Drag-and-drop support

### 3. Project/Task Row
- Checkbox | Type Icon | Title | Project Link | Due Date | Status | Assignee
- Hover shows action icons
- Click opens detail panel

### 4. Hub Navigation
- Collapsible sidebar sections
- Emoji + Title format
- Quick access to saved views

### 5. Search & Filters
- Prominent search bar
- Filter pills that can be added/removed
- "Clear all" to reset

---

## Icons

Using custom SVG icons (not a standard library).
Key icons needed:
- Inbox, Work, Clients, Sales, Projects
- Invoices, Assets, Schedule, Dispatch
- Analytics, Timesheets, Settings
- Search, Filter, Sort, Columns
- Add, Edit, Delete, Archive
- Chevron (expand/collapse)

---

## Responsive Breakpoints

- Mobile: < 768px (sidebar hidden, hamburger menu)
- Tablet: 768px - 1024px (sidebar collapsed)
- Desktop: > 1024px (sidebar expanded)

---

## Implementation Notes for Our Webapp

### What to Mimic
1. Dark sidebar with light main content
2. Color palette (especially teal accent)
3. Card and table styles
4. Status badge system
5. Filter/search toolbar pattern
6. Sticky header with page title

### What to Simplify for MVP
1. Skip complex animations
2. Use shadcn/ui components (already installed)
3. Use Lucide icons instead of custom
4. Single column layouts for mobile

### Tailwind Config Updates
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        coperniq: {
          sidebar: '#1E2433',
          primary: '#00BFA5',
          'primary-hover': '#00A896',
        }
      }
    }
  }
}
```
