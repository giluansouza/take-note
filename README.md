# Take Note

Take Note is a minimal, offline-first notes app built with React Native + Expo.

The app focuses on fast capture and editing with a block-based note model (text, titles, lists, checklists, quotes, and images), stored locally with SQLite.

## Features

- Offline-first (local SQLite)
- Block editor: `text`, `title`, `subtitle`, `quote`, `list`, `checklist`, `image`
- Image attachments (stored locally on-device)
- Archive / unarchive notes
- i18n: English + Portuguese (Brazil)

## Tech Stack

- Expo + React Native
- `expo-router` (file-based routing)
- `expo-sqlite` (local storage)
- `i18next` + `react-i18next` (translations)
- `expo-image-picker` + `expo-file-system` + `expo-image-manipulator` (images)

## Requirements

- Node.js + npm
- Expo tooling (via `npx expo ...`)
- Android Studio (for Android emulator) and/or Xcode (for iOS simulator)

## Getting Started

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run start
```

Convenience shortcuts:

```bash
npm run android
npm run ios
npm run web
```

## Project Structure

- `app/`: screens and routes (Expo Router)
- `components/`: UI + block renderer/components
- `lib/`: storage (SQLite), repositories, i18n, services
- `.docs/`: internal notes/specs

## Legal

- Privacy Policy: `https://giluansouza.github.io/take-note/privacy-policy.html`
- Terms & Conditions: `https://giluansouza.github.io/take-note/terms-and-conditions.html`

## Scripts

- `npm run start`: start Metro bundler (Expo)
- `npm run android`: start + open Android
- `npm run ios`: start + open iOS
- `npm run web`: start web
- `npm run lint`: lint
