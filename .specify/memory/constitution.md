<!--
=== Sync Impact Report ===
Version change: 0.0.0 → 1.0.0 (MAJOR - initial constitution)
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (5 principles)
  - Project Architecture & Technology Stack
  - Development Workflow & Implementation Phases
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ aligned (Constitution Check section matches principles)
  - .specify/templates/spec-template.md ✅ aligned (requirements section supports tenant-scoped entities)
  - .specify/templates/tasks-template.md ✅ aligned (phase structure maps to implementation phases)
Follow-up TODOs: None
========================
-->

# PMS (Project Management System) Constitution

## Project Overview

### Backend (Laravel)

| Layer | Details |
|-------|---------|
| **Framework** | Laravel (PHP 8.x) with Sanctum token-based authentication |
| **Models** | User, Project, Task, Role, Comment, Rating, Notification, GitCommit, ProjectVersion, SupervisorInvitation, StudentInvitation, UserProfile, ProjectActivity |
| **Controllers** | AuthController, UserController, ProjectController, TaskController, CommentController, NotificationController, ProjectVersionController, SupervisorInvitationController, StudentInvitationController, StudentDirectoryController, ProfileController, GitHubAuthController |
| **Middleware** | RoleMiddleware (admin / supervisor / student), Sanctum auth guard |
| **Database** | MySQL — migrations for users, roles, projects, tasks, comments, ratings, notifications, git_commits, project_versions, supervisor_invitations, student_invitations, project_members, user_profiles, project_activities |
| **Auth** | Laravel Sanctum (bearer tokens), role lookup via `roles` table, open registration for student/supervisor (admin creation blocked) |
| **Integrations** | GitHub OAuth for account linking, GitHub API for commit sync and version push |

### Frontend (React + Vite)

| Layer | Details |
|-------|---------|
| **Framework** | React 19 + Vite 7, JavaScript (JSX) |
| **UI Library** | Material UI (MUI) v7 with Emotion, Cairo font, full RTL/Arabic support via `stylis-plugin-rtl` |
| **Pages** | Dashboard, Projects, ProjectDetails, Users, Profile, Login, Register, Landing, Notifications, StudentInvitations, SupervisorInvitations |
| **Components** | ConfirmDialog, SystemBreadcrumbs, EmptyState |
| **State** | AuthContext (token + user profile), ThemeContext |
| **Routing** | React Router DOM v7, protected routes via token check |
| **Extras** | SweetAlert2, React Hot Toast, Recharts for data visualization |

### Current Roles

| Role | Capabilities |
|------|-------------|
| **admin** | Full system access, user management, all projects/tasks visibility |
| **supervisor** | Supervise projects, accept/reject supervision invitations, comment and rate |
| **student** | Create projects, manage tasks, invite supervisors/students, link GitHub |

---

## Core Principles

### I. Data Isolation & Multi-Tenancy (NON-NEGOTIABLE)

Every database query MUST be scoped to the authenticated user's university (tenant). No user, project, task, or any related entity may be visible or accessible outside its university boundary.

- A `University` model and `universities` table MUST be created as the tenant root entity.
- A `university_id` foreign key MUST be added to `users`, `projects`, and `tasks` tables (and propagated to dependent entities via their parent relationships).
- Laravel `Global Scopes` MUST be used to automatically filter all Eloquent queries by the current user's `university_id`.
- Direct SQL queries that bypass Eloquent scopes are FORBIDDEN in application code.
- Seed data and test fixtures MUST include at least two universities to validate isolation.
- **Rationale**: The system will serve multiple universities simultaneously; a single data leak between tenants constitutes a critical security breach.

### II. Backward Compatibility (NON-NEGOTIABLE)

All existing functionality MUST remain operational throughout the upgrade. No migration or code change may break the current login flow, GitHub OAuth integration, project CRUD, task management, invitation system, or any React UI component.

- Existing API response shapes MUST NOT change in a breaking way; new fields are additive only.
- The current Sanctum token flow MUST continue to work unchanged.
- GitHub account linking and commit sync MUST remain functional.
- All existing React pages (Dashboard, Projects, ProjectDetails, Users, Profile, Login, Register, Landing, Notifications, StudentInvitations, SupervisorInvitations) MUST render and function correctly after each phase.
- Database migrations MUST be non-destructive: use `ADD COLUMN` with nullable defaults or backfill scripts, never `DROP COLUMN` on active data.
- **Rationale**: The system is in active use; regressions in core features are unacceptable.

### III. Hierarchical RBAC & Approval Workflow

The role-based access control system MUST be extended with a hierarchical approval mechanism to eliminate unauthorized account creation.

- New student/supervisor accounts MUST default to `status = 'pending'` (not immediately active).
- A `CheckUserStatus` middleware MUST block API access for users with `pending` or `rejected` status.
- Only a `University Admin` (or Super Admin) may approve or reject pending accounts.
- The existing `RoleMiddleware` MUST remain functional; the new status check is an additional layer, not a replacement.
- Role hierarchy: Super Admin > University Admin > Supervisor > Student.
- **Rationale**: Open registration without approval creates a security vulnerability where unverified accounts can access and modify project data.

### IV. API-First & Separation of Concerns

The backend MUST expose all functionality as RESTful JSON API endpoints. The React frontend MUST consume these endpoints exclusively — no server-side rendering, no direct database access from the client.

- Every new feature MUST have its API endpoint implemented and testable before the corresponding UI work begins.
- API responses MUST follow consistent JSON structures: `{ "message": "...", "data": {...} }` for success, `{ "message": "...", "errors": {...} }` for validation failures.
- The `AuthContext` in React MUST be the single source of truth for authentication state, including `university_id` and `status`.
- CORS configuration MUST allow the Vite dev server and production frontend origins.
- **Rationale**: Clean API/UI separation enables independent testing, future mobile clients, and clear responsibility boundaries.

### V. Incremental & Phase-Based Delivery

The architectural upgrade MUST be delivered in three sequential phases, each independently deployable and testable. No phase may depend on incomplete work from a later phase.

- **Phase 1 (Multi-Tenancy Foundation)**: University model, `university_id` foreign keys, Global Scopes — backend only, no UI changes required.
- **Phase 2 (RBAC & Approval Workflow)**: Account status field, `CheckUserStatus` middleware, approval/rejection endpoints and admin UI.
- **Phase 3 (UI & Workspace Isolation)**: University-scoped dashboard, university selection in registration, pending-approval screen, university management for Super Admin.
- Each phase MUST have a clear "done" checkpoint where all existing tests pass and the new functionality is verified.
- Migrations MUST be ordered and idempotent — running them on a fresh database or an existing one MUST produce the same schema.
- **Rationale**: Phased delivery reduces risk, allows validation at each step, and prevents a "big bang" deployment that is difficult to debug.

## Project Architecture & Technology Stack

### Repository Structure

```text
PMS-Project/
├── backend last/           # Laravel API application
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/   # 14 controllers (Auth, User, Project, Task, etc.)
│   │   │   └── Middleware/    # RoleMiddleware + standard Laravel middleware
│   │   ├── Models/            # 13 Eloquent models
│   │   └── Services/         # AuthService (business logic layer)
│   ├── database/
│   │   └── migrations/       # 28 migration files
│   └── routes/
│       └── api.php           # All API route definitions
│
├── frontend/               # React SPA
│   ├── src/
│   │   ├── pages/          # 11 page components
│   │   ├── components/     # 3 shared components
│   │   └── context/        # AuthContext, ThemeContext
│   └── package.json        # React 19, MUI 7, Vite 7
│
└── PLAN.md                 # Architectural upgrade plan (3 phases)
```

### Technology Constraints

- **Backend**: PHP 8.x, Laravel framework, MySQL database, Sanctum auth tokens.
- **Frontend**: React 19, Vite 7, Material UI 7, JavaScript (JSX — no TypeScript currently).
- **Language**: UI is Arabic (RTL) with Cairo font; code comments may be Arabic or English.
- **API Protocol**: REST over HTTP, JSON payloads, Bearer token authentication.
- **Version Control**: Git, feature branches per phase.

### Performance & Scale Targets

- The system MUST support at least 5 concurrent universities (tenants) without query performance degradation.
- Dashboard loading MUST complete within 3 seconds on standard connectivity.
- API endpoints MUST respond within 500ms (p95) for standard CRUD operations.

## Development Workflow & Implementation Phases

### Phase Execution Order

1. **Phase 1 — Multi-Tenancy Foundation**: Create `University` model and migration, add `university_id` to core tables, implement `TenantScope` Global Scope, update seeders.
2. **Phase 2 — RBAC & Approval Workflow**: Add `status` column to users, create `CheckUserStatus` middleware, build approval/rejection API endpoints, add admin approval UI.
3. **Phase 3 — UI & Workspace Isolation**: Update `AuthContext` with `university_id` and `status`, modify `Register.jsx` with university dropdown, create `PendingApproval.jsx`, scope Dashboard stats to tenant, add Super Admin university management screen.

### Code Quality Gates

- Every new migration MUST include a rollback (`down()` method).
- Every new API endpoint MUST validate input using Laravel Form Requests or inline validation.
- Every new middleware MUST return proper HTTP status codes (401 for unauthenticated, 403 for unauthorized).
- Global Scopes MUST be covered by at least one manual test scenario confirming cross-tenant queries return empty results.
- React components MUST handle loading and error states gracefully (no blank screens).

### Naming Conventions

- **Migrations**: `YYYY_MM_DD_HHMMSS_description.php` (Laravel default).
- **Models**: PascalCase singular (`University`, `TenantScope`).
- **Controllers**: PascalCase with `Controller` suffix.
- **React Pages**: PascalCase `.jsx` files in `src/pages/`.
- **API Routes**: kebab-case paths under `/api/` prefix.

## Governance

This constitution is the authoritative reference for all architectural and implementation decisions during the PMS multi-tenancy upgrade. All code changes, migrations, and UI modifications MUST comply with the principles defined above.

- **Amendment Process**: Any principle change requires documenting the rationale, updating this file, and incrementing the version according to semantic versioning (MAJOR for principle removal/redefinition, MINOR for additions, PATCH for clarifications).
- **Compliance Review**: Before merging any phase, verify that Data Isolation, Backward Compatibility, and RBAC principles are not violated.
- **Conflict Resolution**: If a technical constraint makes strict compliance impossible, the deviation MUST be documented in the relevant spec or plan file with justification and a remediation timeline.
- **Guidance**: Use `PLAN.md` at the project root for phase-level implementation details and task tracking.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
