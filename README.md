# Micro Journal

Offline-first personal journal app built with [Expo](https://expo.dev), TypeScript, and [Expo Router](https://docs.expo.dev/router/introduction/).

Development follows a 12-PR roadmap. Current focus: **Phase 2 — Offline-First Journal** (PR #5 journal entry creation). See [ROADMAP.md](ROADMAP.md) for the full plan.

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

SQLite is used for offline-first storage: structured queries, migrations, and reliable local CRUD without a network.

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

## Manual test (Expo Go / Android)

Use this checklist after implementing entry creation:

1. Start the app with `npx expo start` and open it in Expo Go.
2. Tap **New Entry**.
3. Leave the content empty and tap **Save** — a validation message should appear; you stay on the form.
4. Enter a short reflection, select a mood, tap **Save** — you return to the home screen.
5. Open **New Entry** again, type something, tap **Cancel** — you return home without saving that draft.
6. Optionally force-quit Expo Go and reopen the app — it should initialize cleanly (loading, then home).

**Persistence note:** Because this PR does not include an entry list, relaunching only confirms database initialization succeeds. It does **not** visually prove the entry was stored. Automated create-flow tests assert the repository receives the correct data; existing SQLite repository tests cover durable storage. Seeing created entries in the UI lands in the journal timeline PR.

## Project structure

| Path | Role |
|------|------|
| `src/app/` | Expo Router screens and layouts (file-based routes) |
| `src/components/` | Shared UI components |
| `src/constants/` | Theme tokens and shared constants |
| `src/database/` | SQLite init, migrations, repository (no UI) |
| `src/domain/` | Domain models and Zod validation (no UI/storage) |
| `src/hooks/` | Reusable hooks (e.g. color scheme / theme) |

## Learn more

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Color schemes](https://docs.expo.dev/guides/color-schemes/)
