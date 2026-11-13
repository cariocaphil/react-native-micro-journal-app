# Micro Journal

Offline-first personal journal app built with [Expo](https://expo.dev), TypeScript, and [Expo Router](https://docs.expo.dev/router/introduction/).

Development follows an incremental PR roadmap. Current focus: **PR #9 — TanStack Query Integration** (data lifecycle refactor over SQLite). See [ROADMAP.md](ROADMAP.md) for the full plan.

## Requirements

- Node.js (current LTS recommended)
- [Expo Go](https://expo.dev/go) on an Android or iOS device (or an emulator/simulator)

## Get started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npx expo start
   ```

3. Scan the QR code with Expo Go, or open an Android emulator / iOS simulator from the terminal.

## Checks

```bash
npx tsc --noEmit
npm run lint
npm test
```

## Domain model

Journal concepts live under `src/domain/journal/` and stay independent of UI and persistence.

**`JournalEntry`** fields:

| Field | Rules |
|-------|--------|
| `id` | Non-empty string |
| `content` | Trimmed, non-empty, max 500 characters |
| `mood` | One of `great`, `good`, `okay`, `bad`, `awful` |
| `createdAt` / `updatedAt` | ISO 8601 datetimes (including timezone offsets); `updatedAt` must not precede `createdAt` (compared as instants) |

**`CreateJournalEntryInput`** / **`UpdateJournalEntryInput`** validate `content` and `mood` only. IDs and timestamps are assigned by the persistence layer when creating or updating.

## Local persistence

SQLite is used for offline-first storage: structured queries, migrations, and reliable local CRUD without a network. **SQLite remains the source of truth.**

| Topic | Detail |
|-------|--------|
| Library | `expo-sqlite` (async API), included in Expo Go |
| Database file | Opened via `openJournalDatabase()` (default name `micro-journal.db` under Expo’s default database directory) |
| Initialization | Opens the DB, sets `PRAGMA journal_mode = WAL`, then applies versioned migrations |
| Migrations | `PRAGMA user_version` + ordered migrations in `src/database/migrations.ts`, applied with `withExclusiveTransactionAsync` on the transaction connection |
| Repository | `createJournalRepository(db)` in `src/database/journal-repository.ts` — parameterized SQL, Zod at the boundary, snake_case ↔ camelCase mapping |
| IDs | `expo-crypto` `randomUUID()` (Hermes does not provide a reliable global `crypto.randomUUID`) |

Persistence tests use **`expo-sqlite-mock`**, which adapts Jest to a **better-sqlite3** backend (SQLite C library). That is not Expo’s native SQLite module; it still exercises real SQL, transactions, and PRAGMAs. Tests set `EXPO_SQLITE_MOCK` to a temporary on-disk file so exclusive-transaction secondary connections share the same database.

```bash
npm test
```

## Data lifecycle (TanStack Query)

[`@tanstack/react-query`](https://tanstack.com/query) is an in-memory cache and synchronization layer over the repository. It does **not** talk to a network and does **not** persist its cache.

| Topic | Detail |
|-------|--------|
| Provider | `QueryClientProvider` nested under `JournalRepositoryProvider` in `src/app/_layout.tsx` |
| Defaults | `staleTime: Infinity`, `refetchOnWindowFocus: false`, `refetchOnReconnect: false`, `retry: false` |
| Query keys | `src/journal/journal-query-keys.ts` — `['journal', 'entries']`, `['journal', 'entry', id]` |
| Reads | `useJournalEntries` / `useJournalEntryDetail` use `useQuery` against `findAll` / `findById` |
| Writes | Create, update, and delete use `useMutation`; after a successful SQLite write, queries are invalidated (fire-and-forget) and navigation proceeds |
| Freshness | Mutations invalidate active queries; list/detail no longer rely on `useFocusEffect` reloads |

## Manual test (Expo Go)

Use this checklist for the full offline CRUD loop:

1. Start the app with `npx expo start` and open it in Expo Go.
2. Tap **New Entry**, leave content empty, tap **Save** — validation appears; you stay on the form.
3. Enter a short reflection, select a mood, tap **Save** — you return home and the new entry appears in the list.
4. Tap an entry — detail shows mood, dates, and full content.
5. Tap **Edit**, change content and/or mood, tap **Save** — you return to detail with updated values; home shows them after back navigation.
6. Tap **Edit**, change a field, tap **Cancel** — changes are discarded.
7. On detail, tap **Delete**, confirm — you return home and the entry is gone.
8. Optionally force-quit Expo Go and reopen — entries still load from SQLite.

## Project structure

| Path | Role |
|------|------|
| `src/app/` | Expo Router screens and layouts only (file-based routes; no tests/helpers) |
| `src/components/` | Shared UI components |
| `src/constants/` | Theme tokens and shared constants |
| `src/database/` | SQLite init, migrations, repository, QueryClient helpers (no UI) |
| `src/domain/` | Domain models and Zod validation (no UI/storage) |
| `src/hooks/` | Screen/data hooks (list, detail, forms, delete, theme) |
| `src/journal/` | Journal helpers, query keys, and colocated screen/submit tests (kept outside the router tree) |

## Learn more

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Color schemes](https://docs.expo.dev/guides/color-schemes/)
