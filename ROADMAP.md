# Development Roadmap

Incremental PR plan for Micro Journal. See [README.md](README.md) for setup and run instructions.

**Status key:** Merged · In progress · Planned

---

## Phase 1 — Foundation & Navigation

### PR #1 — Expo + TypeScript Foundation (Merged)

**Branch:** `setup/1-expo-foundation`

Initialize Expo, TypeScript, and Expo Router. Verify the application runs on an Android device using Expo Go.

### PR #2 — App Shell & Navigation (Merged)

**Branch:** `feature/2-app-shell-navigation`

Replace the Expo starter experience with a journal home screen, placeholder entry screen, basic Stack navigation, and system light/dark theme support.

### PR #3 — Journal Domain Model & Validation (Merged)

**Branch:** `feature/3-journal-domain`

Define the `JournalEntry` model, mood types, Zod validation schemas, and domain-level unit tests.

---

## Phase 2 — Offline-First Journal

### PR #4 — SQLite Persistence & Migrations (Merged)

**Branch:** `feature/4-sqlite-persistence`

Introduce Expo SQLite, database initialization, schema migrations, and a `JournalRepository` with typed CRUD operations and focused tests.

### PR #5 — Journal Entry Creation (Merged)

**Branch:** `feature/5-journal-entry-creation`

Connect the New Entry screen to domain validation and SQLite persistence: form input, mood selection, validate with `CreateJournalEntrySchema`, save via `JournalRepository`, navigate home on success. Wire a thin repository provider in the root layout (no service layer). Entry listing remains out of scope.

### PR #6 — Journal Entry Listing & Home Screen (Merged)

**Branch:** `feature/6-journal-entry-list`

Replace the home placeholder with a `FlatList` of persisted entries via existing `JournalRepository.findAll()` (newest first). Load on screen focus with `useFocusEffect`, including loading, empty, initial-error, and non-blocking refresh-error states. Completes the write → persist → read → display loop without a service layer.

### PR #7 — Journal Entry Detail & Deletion (Merged)

**Branch:** `feature/7-entry-detail-deletion`

Open an entry from Home via `/entry/[id]`, load with `findById`, show full content/mood/dates, and delete after native Alert confirmation. Return home so the listing refreshes. No service layer; editing remains out of scope.

### PR #8 — Entry Editing (Merged)

**Branch:** `feature/8-journal-entry-editing`

Implement entry editing, form validation for updates, keyboard handling, and navigation from the detail screen.

**Milestone:** Fully functional offline journal (create → list → view → edit → delete).

### PR #9 — TanStack Query Integration (Merged)

**Branch:** `refactor/9-tanstack-query-integration`

Introduce `@tanstack/react-query` as an in-memory cache and synchronization layer over SQLite. Migrate list/detail loading to `useQuery` and create/update/delete to `useMutation` with cache invalidation. Remove custom focus-reload and generation-counter lifecycle code without changing journal functionality. SQLite remains the source of truth; no network or cache persistence.

---

## Phase 3 — Security & Privacy

### PR #10 — Biometric Authentication (In progress)

**Branch:** `feature/10-biometric-authentication`

Integrate `expo-local-authentication`, detect biometric capabilities, show a lock screen that replaces journal routes until unlock, and re-lock on AppState background transitions. Biometrics unavailable → informative locked state (no silent bypass, no custom PIN). Access gate only—not database encryption; TanStack Query cache is not cleared on lock.

**Milestone:** Biometrically protected journal.

---

## Phase 4 — Polish & Encryption

### PR #12 — Dark Mode, Accessibility & UX (Planned)

**Branch:** `feature/12-ui-polish`

Refine the existing light/dark theme implementation, improve accessibility, keyboard interactions, empty states, and overall usability.

### PR #13 — Encrypted Local Storage (Planned)

**Branch:** `security/13-database-encryption`

Investigate and implement SQLCipher database encryption, secure encryption-key management, and appropriate migration and recovery behavior. Use Expo Development Builds where required.

**Milestone:** Privacy-focused offline journal.
