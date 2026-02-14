# Mindstack

A Notion‑style notes app built with Next.js, Tailwind, and SQLite. Mindstack focuses on a fast, block‑based editor (text, headings, lists, toggles, quotes, etc.), page management, and a simple local persistence layer using Drizzle ORM over SQLite.

## Features

- Block editor with common block types:
  - Text
  - Heading 1–3
  - Quote
  - Bullet list
  - Ordered list
  - Todo list
  - Divider
  - Toggle (collapsible section with nested blocks)
- Keyboard behaviors:
  - Enter splits a block into two blocks.
  - Backspace merges with previous block when at the start of a block.
  - Typing shortcuts convert blocks (implemented in `useEditor`):
    - `1.` → ordered list
    - `-` → bullet list
    - `?` → todo list
    - `#`, `##`, `###` → headings
    - `---` → divider
- Sidebar page list with create/delete.
- Theme support via `next-themes` (class-based dark mode).
- Local database with SQLite + Drizzle ORM.

## Tech Stack

- **Framework:** Next.js (App Router)
- **UI:** Tailwind CSS v4, Radix UI, Lucide icons, Sonner
- **State/Editor logic:** React hooks (`useEditor`)
- **Database:** SQLite (`better-sqlite3`) + Drizzle ORM

## Project Structure

- `app/` — Next.js App Router pages and API routes
  - `app/pages/[id]/page.tsx` — editor page
  - `app/api/*` — JSON API for pages and blocks
- `components/` — UI + editor components
  - `components/editor/` — block renderer + block types
  - `components/appsidebar.tsx` — sidebar UI
- `hooks/` — editor logic and local storage utilities
- `db/` — SQLite database, schema, and migrations

## Data Model

Defined in `db/schema.ts`:

- **pages**
  - `id`, `title`, `parentPageId`, timestamps
- **blocks**
  - `id`, `pageId`, `parentBlockId`, `type`, `blockOrder`, timestamps
- **block_data**
  - `blockId`, `data` (JSON)

Block nesting uses `parentBlockId` (toggle sections are stored as children).

## API Routes

### Pages

- `GET /api/pages` — list all pages
- `POST /api/pages` — create a page
- `GET /api/pages/:id` — fetch a page
- `PATCH /api/pages/:id` — rename a page
- `DELETE /api/pages/:id` — delete a page

### Blocks

- `GET /api/pages/:id/blocks` — list blocks for a page
- `POST /api/pages/:id/blocks` — create a block
- `PATCH /api/blocks/:id` — update a block (type/order/data)
- `DELETE /api/blocks/:id` — delete a block
- `GET /api/blocks/:id/children` — list child blocks

## Local Database

The app uses a local SQLite file at `db/database.db` (tracked in this repo). If you want a fresh database, delete this file and re-run migrations.

**Drizzle config:** `drizzle.config.ts`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint

## Notes

- The editor logic lives in `hooks/useEditor.ts`.
- `components/editor/renderor.tsx` is the block renderer.
- `components/editor/blocks/` contains block implementations (text, list, toggle, etc.).
- Dark mode is controlled by `next-themes` via `ThemeProvider` in `app/layout.tsx`.

## License

Private project (no license specified).
