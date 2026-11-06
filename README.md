# Micro Journal

Offline-first personal journal app built with [Expo](https://expo.dev), TypeScript, and [Expo Router](https://docs.expo.dev/router/introduction/).

Development follows a 12-PR roadmap. Current focus: **Phase 1 — Foundation & Navigation** (PR #2 app shell). See [ROADMAP.md](ROADMAP.md) for the full plan.

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
```

## Project structure

| Path | Role |
|------|------|
| `src/app/` | Expo Router screens and layouts (file-based routes) |
| `src/components/` | Shared UI components |
| `src/constants/` | Theme tokens and shared constants |
| `src/hooks/` | Reusable hooks (e.g. color scheme / theme) |

## Learn more

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Color schemes](https://docs.expo.dev/guides/color-schemes/)
