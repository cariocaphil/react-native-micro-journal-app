# Development Roadmap

Incremental 12-PR plan for Micro Journal. See [README.md](README.md) for setup and run instructions.

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

### PR #5 — Journal Entry Creation (In progress)

**Branch:** `feature/5-journal-entry-creation`

Connect the New Entry screen to domain validation and SQLite persistence: form input, mood selection, validate with `CreateJournalEntrySchema`, save via `JournalRepository`, navigate home on success. Wire a thin repository provider in the root layout (no service layer). Entry listing remains out of scope.

### PR #6 — Journal Timeline (Planned)

**Branch:** `feature/6-journal-timeline`

Implement the journal overview using `FlatList`, displaying locally persisted entries ordered by date, with appropriate loading and empty states. Enables end-to-end UI verification of created entries after relaunch.

### PR #7 — Entry Editing (Planned)

**Branch:** `feature/7-entry-editor`

Implement entry editing, form validation for updates, keyboard handling, and navigation from the timeline.

### PR #8 — Mood Picker & Entry Deletion (Planned)

**Branch:** `feature/8-mood-picker`

Refine reusable mood selection, entry deletion with confirmation, and corresponding tests.

**Milestone:** Fully functional offline journal.

---

## Phase 3 — Security & Privacy

### PR #9 — Biometric Authentication (Planned)

**Branch:** `feature/9-biometric-auth`

Integrate `expo-local-authentication`, detect biometric capabilities, implement an unlock screen, and handle authentication failures and unavailable biometrics.

### PR #10 — Protected Navigation & App Lifecycle (Planned)

**Branch:** `feature/10-app-lock`

Protect journal routes, handle foreground/background transitions, and re-lock the application appropriately. Ensure journal content is not displayed while locked.

**Milestone:** Biometrically protected journal.

---

## Phase 4 — Polish & Encryption

### PR #11 — Dark Mode, Accessibility & UX (Planned)

**Branch:** `feature/11-ui-polish`

Refine the existing light/dark theme implementation, improve accessibility, keyboard interactions, empty states, and overall usability.

### PR #12 — Encrypted Local Storage (Planned)

**Branch:** `security/12-database-encryption`

Investigate and implement SQLCipher database encryption, secure encryption-key management, and appropriate migration and recovery behavior. Use Expo Development Builds where required.

**Milestone:** Privacy-focused offline journal.
