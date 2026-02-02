# Headcount Management Tool

A browser-based headcount planning and budgeting tool for hierarchical organizations. Built with React and Vite, it supports multi-org structures, budget lifecycle management, approval workflows, and CSV-based data sync.

## Tech Stack

- **React 19** with React Router 7
- **Vite 7** (dev server and build)
- **UUID** for ID generation
- **GitHub Pages** for deployment (`gh-pages`)

## Getting Started

```bash
npm install
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run deploy     # Build + deploy to GitHub Pages
```

## Navigation

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | KPIs and team breakdown for current user's scope |
| `/org` | Organization | Interactive org chart with inline editing |
| `/budget-management` | Budget Mgmt | Budget, proposals, transfers, challenges, timeline |
| `/actuals-management` | Actuals Mgmt | Employees and job requisitions |
| `/approvals` | Approvals | Approval queue for direct reports' submissions |
| `/admin` | Admin | Audit log, data sync (CSV import/export), user guide |

## Features

### Dashboard

Overview of the current user's org subtree for a selected year:

- **9 KPI cards**: Total budget HC, current actuals, open positions, pending/draft proposals, pending impact, open/pending/filled requisitions
- **Team breakdown table**: Per-org budget vs. actuals with pending changes

### Organization Hierarchy

- Multi-root org tree (supports multiple top-level organizations)
- Collapsible nodes with expand/collapse toggle
- Inline stats per node: Budget (B), Actuals (A), Pending proposals (P), Open requisitions (R), Pending transfers (T), Pending challenges (C)
- Add, edit, delete positions with drag-safe parent validation
- Editing restricted to subordinate orgs only (not the user's own org)

### Budget Management (5 tabs)

**My Budget** — View and edit headcount budgets for subordinate orgs. Shows budgeted HC, current actuals, open positions, and pending impact.

**Proposals** — Create and manage budget change requests (delta +/-). Statuses: draft, pending_approval, approved, rejected. Includes live budget preview and justification.

**Transfers** — Peer-to-peer budget reallocation between orgs. The receiver must accept or reject. Shows budget impact preview for the sender.

**Challenges** — A superior issues a budget reduction target to a subordinate. The subordinate can only acknowledge (no reject). Acknowledging reduces the budget automatically.

**Timeline** — Visual bar chart of all budget-affecting events for a selected org. Color-coded by type (proposals, transfers, challenges) with confirmed vs. projected totals.

### Actuals Management (2 tabs)

**Actuals** — Track employees by org unit. Each org has one head (flagged with `isHead`). Supports active/departed status tracking.

**Requisitions** — Request new positions or substitutions. Link funding to an existing budget or a budget change proposal. Statuses: draft, pending_approval, approved, rejected, open, filled, cancelled.

### Approvals

Approval queue for the current user's direct reports:

- **Budget change proposals**: Approve, reject, or escalate to the user's superior
- **Job requisitions**: Approve or reject, with funding source details shown inline
- Also displays the user's own pending submissions (read-only)

Escalation moves a proposal up the chain, reassigning `requestedBy` to the escalator's org.

### Administration (3 tabs)

**Audit Log** — Filterable activity log of all system actions. Categories: Proposals, Requisitions, Budget, Actuals, Transfers, Challenges, Organization.

**Data Sync** — CSV import/export for all entities (org nodes, budgets, actuals, proposals, requisitions). Includes a Workday integration guide. Import replaces all existing data.

**Guide** — Built-in user guide with table of contents, workflow explanations, and glossary.

## Data Model

| Entity | Key Fields |
|---|---|
| **OrgNode** | `id`, `title`, `parentId` |
| **Budget** | `id`, `orgId`, `year`, `budgetedHC`, `notes` |
| **Proposal** | `id`, `orgId`, `title`, `delta`, `year`, `status`, `requestedBy`, `approvedBy`, `escalatedFrom` |
| **Actual** | `id`, `orgId`, `name`, `role`, `startDate`, `status`, `isHead` |
| **Requisition** | `id`, `orgId`, `role`, `type`, `fundingType`, `fundingId`, `status`, `requestedBy` |
| **Transfer** | `id`, `fromOrgId`, `toOrgId`, `amount`, `year`, `status`, `proposedBy`, `acceptedBy` |
| **Challenge** | `id`, `targetOrgId`, `amount`, `year`, `status`, `issuedBy`, `acknowledgedBy` |
| **AuditEntry** | `id`, `action`, `description`, `detail`, `userId`, `timestamp` |

### Seed Data

Two sample organizations are included:

- **TechCorp** — 10 org units (CEO, VP Engineering, VP Sales, Finance, Frontend, Backend, Platform, Sales West, Sales East, UI Team), 16 employees, budgets ranging 8-40 HC
- **MediaGroup** — 5 org units (CEO, Content, Marketing, Editorial, Digital), 9 employees, budgets ranging 8-20 HC

Seed data includes example proposals (11), transfers (6), challenges (6), and requisitions (5) in various statuses.

## Permissions Model

- **Org chart editing**: Subordinate orgs only (user cannot edit their own org)
- **Budget management**: Subordinate orgs only
- **Proposals and requisitions**: Own org + subordinates
- **Approvals**: Only proposals/requisitions from direct reports
- **Challenges**: Can issue to subordinates, receive from superiors
- **Transfers**: Can send from own orgs, receive from any org
- **User switcher**: Allows role-playing as any employee marked as head

## Responsive Design

The UI adapts to three viewport sizes:

- **Desktop** (> 768px): Full layout with side-by-side org trees
- **Tablet** (481-768px): Wrapped navbar, horizontal-scrolling tables, stacked org tree
- **Mobile** (< 480px): Compact fonts and spacing, wrapped action buttons, full-width modals

## Project Structure

```
src/
  components/
    Navbar.jsx           # Top navigation bar
    OrgTree.jsx          # Organization hierarchy visualization
    UserSwitcher.jsx     # User role switcher dropdown
  context/
    AppContext.jsx        # Global state (useReducer + Context API)
  data/
    seed.js              # Initial demo data for both organizations
  pages/
    Dashboard.jsx        # Home page with KPIs
    BudgetManagement.jsx # Budget, proposals, transfers, challenges, timeline
    ActualsManagement.jsx# Employees and requisitions
    Approvals.jsx        # Approval queue
    Admin.jsx            # Audit log, data sync, user guide
  App.jsx                # Router and layout
  App.css                # All styles including responsive breakpoints
  main.jsx               # Entry point
```
