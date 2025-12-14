# PROJECT_CONTEXT.md - Hard Rock Money

This document serves as the **Source of Truth** for the "Hard Rock Money" project, detailing its infrastructure, architecture, and deployment context.

## 1. Project Overview

*   **Name**: Hard Rock Money (Antigravity)
*   **Stack**:
    *   **Framework**: Next.js 14 (App Router)
    *   **Language**: TypeScript
    *   **Styling**: Tailwind CSS
    *   **Database/ORM**: PostgreSQL / Prisma ORM
    *   **Authentication**: NextAuth.js
*   **Design Philosophy**:
    *   **Aesthetic**: "Hard Rock" - Monochrome (Black & White), High Contrast.
    *   **UI Style**: Glassmorphism, Premium feel.
    *   **Theme**: Supports Light/Dark modes (configured via Tailwind `darkMode: 'class'`).

## 2. Infrastructure & Deployment (Docker)

The project runs in a fully containerized environment using Docker Compose.

*   **Services**:
    *   `app`: The Next.js application (Frontend + Backend API). Built from `node:18-alpine`.
    *   `db`: PostgreSQL database (`postgres:15-alpine`).
*   **Running the Project**:
    *   **Command**: `docker-compose up --build` (Rebuilds and starts containers).
    *   **Restart**: `docker-compose restart app` (Restarts just the app service).
*   **Environment**:
    *   Configuration is managed via a `.env` file in the root directory.
    *   **Key Variables**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
*   **Ports**:
    *   **App**: `3000` (Mapped to host `3000`).
    *   **Database**: `5432` (Mapped to host `5432`).

## 3. Database Schema (Prisma Models)

The database schema is defined in `prisma/schema.prisma`.

### Models
*   **User**: Authentication and profile data.
*   **Account**: Represents financial sources (Wallets, Cards, Cash, Crypto). Linked to `User`.
    *   **Default Account**: Each user can mark one account as default (`isDefault: Boolean`). The default account is automatically pre-selected in Add Expense, Add Income, and Recurring Expense modals.
*   **Category**: Classification for income/expenses. Linked to `User`.
*   **Transaction**: Individual financial records.
    *   **Relationships**: Linked to `Account` and `Category`. Can be linked to a `RecurringExpense`.
*   **RecurringExpense**: Definitions for subscriptions and regular payments.
    *   **Fields**: `id`, `userId`, `name`, `amount`, `accountId`, `categoryId`, `recurrenceType` (DAILY/WEEKLY/MONTHLY/YEARLY), `recurrenceInterval`, `startDate`, `lastAppliedDate`, `isActive`, `isPaused`, `createdAt`, `updatedAt`
    *   **Function**: Generates `Transaction` records via manual application (Play button) or future automation. Paused expenses are excluded from monthly totals and cannot generate transactions.

## 4. Project Structure & Key Directories

*   **`src/app`** (App Router Pages):
    *   `/`: **Dashboard**. Main menu with circular navigation.
    *   `/settings`: **Settings**. Full-screen split layout for configuration.
    *   `/transactions`: **Transactions**. Full-screen compact table view.
    *   `/recurring`: **Recurring Expenses**. Full-screen split view (70% list table, 30% form) for managing subscriptions and recurring payments.
    *   `/api`: Backend API routes.
        *   `/auth`: NextAuth endpoints.
        *   `/accounts`: CRUD for accounts.
        *   `/accounts/set-default`: POST endpoint to set default account (transactional: resets all, sets one).
        *   `/categories`: CRUD for categories.
        *   `/transactions`: CRUD for transactions.
        *   `/recurring`: CRUD operations (GET, POST, PUT, DELETE)
        *   `/recurring/[id]/toggle-pause`: Toggle pause status (PUT)
        *   `/recurring/apply/[id]`: Manual application endpoint (creates transaction, updates balance, sets lastAppliedDate)
*   **`src/lib`**: Shared utilities.
    *   `prisma.ts`: Prisma client instance.
    *   `auth.ts`: NextAuth configuration (separated to avoid circular dependencies).
    *   `utils.ts`: Helper functions (e.g., `cn` for Tailwind).
*   **`src/components`**: Reusable UI components (Modals, Headers, Forms, `TransactionRow`, etc.).
*   **`public`**: Static assets.
    *   `/favicon`: Custom favicons.

## 5. Design System Specifics

*   **Layouts**:
    *   **Dashboard**: Features a large centered background image with a unique circular navigation menu.
    *   **Settings / Transactions / Recurring / Budget**: Use a **Full-Screen Split Layout** (`flex h-screen w-full overflow-hidden`).
        *   **Left Panel**: Sidebar/Navigation (Settings: `w-80`) or List view (75% width for others).
        *   **Right Panel**: Content area or Form with image background (`/img/back.jpg`) and glassmorphism overlay (`bg-black/50 backdrop-blur-md`).
        *   **Content Constraint**: Right panel content uses `max-w-4xl mx-auto` to center forms and reduce mouse travel on large monitors.
*   **Layout Stabilization**:
    *   **App-Shell Pattern**: The root `html` and `body` tags use `h-full w-full overflow-hidden` to create a fixed viewport.
    *   **Purpose**: Prevents scrollbar toggling and layout shift during navigation between pages.
    *   **Dashboard Positioning**: Uses static positioning with fixed margins (`mt-8`) instead of flex centering to eliminate vertical jump during hydration.
    *   **Internal Scrolling**: Individual pages/components use `overflow-y-auto` for scrolling within their containers.
*   **Tailwind**: Configured for class-based dark mode.

## 6. Development Notes

*   **Authentication**:
    *   Configuration is strictly located in `src/lib/auth.ts`.
    *   `src/app/api/auth/[...nextauth]/route.ts` imports options from `src/lib/auth.ts`.
*   **API Logic**:
    *   All API routes **MUST** validate the session using `getServerSession(authOptions)` before performing any database operations.
    *   Data ownership is strictly enforced (users can only access their own data).
*   **Category Filtering**:
    *   The `/api/categories` endpoint supports query parameter `?type=INCOME` or `?type=EXPENSE` to filter categories by type.
    *   **AddExpenseModal**: Fetches only EXPENSE categories (`/api/categories?type=EXPENSE`).
    *   **AddIncomeModal**: Fetches only INCOME categories (`/api/categories?type=INCOME`).
    *   **Recurring Expenses Page**: Fetches only EXPENSE categories (recurring expenses are expense-only).
    *   **Settings Page**: Fetches all categories and separates them on the frontend.
*   **Favicons**: Located in `public/favicon/`. Ensure permissions allow the container to read these files.
*   **Logout**: Header component includes a Logout button (top-right) that calls `/api/auth/signout` and redirects to login.
*   **Session Management**: Rotating `NEXTAUTH_SECRET` in `docker-compose.yml` invalidates all active sessions (forces logout).
*   **ESC Key Closure**: Full-screen pages (Settings, Budget, Recurring, Transactions) and modals (AddExpenseModal, AddIncomeModal) use the `useCloseOnEscape` hook from `src/lib/hooks/useCloseOnEscape.ts` to close on ESC key press.

## 7. Change Log (Recent Updates)

### [2025-12-14] UI/UX Overhaul v2.0: Clean Industrial/Flat Dashboard
*   **Goal**: Complete refactor from Glassmorphism/Neon to Clean Industrial/Flat SaaS dashboard with persistent navigation.
*   **New Component**: `DashboardLayout.tsx`
    *   **Left Sidebar** (w-64, fixed): Logo, navigation (Dashboard, Transactions, Recurring, Budget, Settings), user email, logout button.
    *   **Top Header** (sticky): Breadcrumbs, "Add Expense/Income" buttons, theme/language toggles.
    *   **Active State**: `bg-zinc-900 text-white` (dark) / `bg-zinc-100 text-zinc-900` (light) with left border accent.
*   **Dashboard** (`src/app/page.tsx`):
    *   Replaced card-based navigation with **Bento Grid** (grid-cols-12).
    *   Widgets: Total Balance, Accounts Overview, Budget Progress (top 3), Recent Transactions (last 5).
*   **Visual System**:
    *   **Backgrounds**: Solid `bg-zinc-50` (light) / `bg-zinc-950` (dark). No background images.
    *   **Cards**: `border border-zinc-200/800`, `rounded-xl`, no glassmorphism.
    *   **Typography**: Inter font, tight headers, `text-zinc-500` for secondary text.
    *   **Buttons**: Primary = solid `bg-zinc-900 dark:bg-white`, Secondary = bordered.
*   **Page Updates**: Transactions, Recurring, Budget, Settings all wrapped in `DashboardLayout`.
    *   Removed 75/25 split layouts.
    *   Analytics/stats moved to page headers.
    *   Settings uses internal tabs sidebar.

### [2025-12-14] UI/UX Refactor: Ultra-Minimalist Flat Background
*   **Goal**: Replace outdated image backgrounds with a CSS-only, 2D flat design.
*   **Changes**:
    *   **Layout** (`src/app/layout.tsx`):
        *   **Base**: `bg-zinc-950` (Deep Matte Black).
        *   **Pattern**: Subtle 24px grid using CSS `linear-gradient` (gray lines at ~3% opacity).
        *   **Style**: Swiss Design / Blueprint aesthetic - no glow, no 3D effects.
    *   **Individual pages** retain their existing structure but now sit on the global flat background.

### [2025-12-14] UI/UX Refactor: Minimalist Dashboard Redesign
*   **Goal**: Remove heavy containers, implement clean card-based navigation inspired by modern CRM dashboards.
*   **Changes**:
    *   **Layout** (`src/app/layout.tsx`): Dual-theme background grid support.
        *   Light mode: `bg-stone-100` with subtle dark grid lines.
        *   Dark mode: `bg-zinc-950` with subtle light grid lines.
    *   **Dashboard** (`src/app/page.tsx`): Complete redesign.
        *   Removed: Heavy rounded container with background image.
        *   Added: Clean responsive grid (2-3 columns) of minimalist cards.
        *   Cards: White/dark backgrounds with subtle borders, hover shadows.
        *   Icons: Pill-shaped backgrounds with accent colors.
