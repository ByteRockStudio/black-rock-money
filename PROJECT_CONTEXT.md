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
*   **Category**: Classification for income/expenses. Linked to `User`.
*   **Transaction**: Individual financial records.
    *   **Relationships**: Linked to `Account` and `Category`. Can be linked to a `RecurringExpense`.
*   **RecurringExpense**: Definitions for subscriptions and regular payments.
    *   **Fields**: `id`, `userId`, `name`, `amount`, `accountId`, `categoryId`, `recurrenceType` (DAILY/WEEKLY/MONTHLY/YEARLY), `recurrenceInterval`, `startDate`, `lastAppliedDate`, `isActive`, `createdAt`, `updatedAt`
    *   **Function**: Generates `Transaction` records via manual application (Play button) or future automation.

## 4. Project Structure & Key Directories

*   **`src/app`** (App Router Pages):
    *   `/`: **Dashboard**. Main menu with circular navigation.
    *   `/settings`: **Settings**. Full-screen split layout for configuration.
    *   `/transactions`: **Transactions**. Full-screen compact table view.
    *   `/recurring`: **Recurring Expenses**. Full-screen split view (70% list table, 30% form) for managing subscriptions and recurring payments.
    *   `/api`: Backend API routes.
        *   `/auth`: NextAuth endpoints.
        *   `/accounts`: CRUD for accounts.
        *   `/categories`: CRUD for categories.
        *   `/transactions`: CRUD for transactions.
        *   `/recurring`: CRUD operations (GET, POST, PUT, DELETE)
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
    *   **Settings / Transactions / Recurring**: Use a **Full-Screen Split Layout**.
        *   **Left**: Sidebar/Navigation or List view.
        *   **Right**: Content area or Form, often with an image background and glassmorphism overlays.
*   **Tailwind**: Configured for class-based dark mode.

## 6. Development Notes

*   **Authentication**:
    *   Configuration is strictly located in `src/lib/auth.ts`.
    *   `src/app/api/auth/[...nextauth]/route.ts` imports options from `src/lib/auth.ts`.
*   **API Logic**:
    *   All API routes **MUST** validate the session using `getServerSession(authOptions)` before performing any database operations.
    *   Data ownership is strictly enforced (users can only access their own data).
*   **Favicons**: Located in `public/favicon/`. Ensure permissions allow the container to read these files.
*   **Logout**: Header component includes a Logout button (top-right) that calls `/api/auth/signout` and redirects to login.
*   **Session Management**: Rotating `NEXTAUTH_SECRET` in `docker-compose.yml` invalidates all active sessions (forces logout).
