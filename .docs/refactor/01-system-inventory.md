# Phase 1 — System Inventory

**Date:** 2026-02-05
**Project:** Take Note (tome-nota)
**Location:** `/home/giluan/Devboot/react-native/tome-nota`
**Analyst:** Claude Opus 4.5

---

## 1. Project Overview

| Property | Value |
|----------|-------|
| Name | Take Note |
| Package | com.devboot.takenote |
| Version | 1.0.0 |
| Project Size | 537MB (486MB node_modules) |
| TypeScript Files | 41 files |
| EAS Project ID | 2897dec3-ce31-4b97-ae1b-003204747d9b |

---

## 2. Expo SDK & Platform Targets

| Property | Value |
|----------|-------|
| Expo SDK | ~54.0.33 |
| React | 19.1.0 |
| React Native | 0.81.5 |
| TypeScript | ~5.9.2 |
| New Architecture | **ENABLED** |
| React Compiler | **ENABLED** |

### Platform Targets

| Platform | Status | Notes |
|----------|--------|-------|
| Android | Primary | Edge-to-edge enabled, predictive back disabled |
| iOS | Supported | Tablet support enabled |
| Web | Partial | expo-router supports web but not primary target |

---

## 3. Navigation Strategy

| Property | Value |
|----------|-------|
| Library | expo-router ~6.0.23 |
| Strategy | File-based routing |
| Type Safety | Typed routes enabled |

### Route Structure

```
app/
├── _layout.tsx      # Root layout with providers
├── index.tsx        # Notes list (home)
├── note/[id].tsx    # Note editor (dynamic route)
├── archived.tsx     # Archived notes
└── settings.tsx     # App settings
```

### Provider Hierarchy

```tsx
GestureHandlerRootView
└── SafeAreaProvider
    └── PremiumProvider
        └── ThemeProvider
            └── AppContent (Stack navigator)
```

---

## 4. State Management Approach

| Layer | Strategy | Library |
|-------|----------|---------|
| Global Theme | React Context | Custom ThemeContext |
| Global Premium | React Context | Custom PremiumContext |
| Global i18n | React Context | react-i18next |
| Screen State | useState hooks | React core |
| Async State | Custom hooks | useImagePicker, useAds |

### State Density by Screen

| Screen | useState | useCallback | useEffect | useMemo |
|--------|----------|-------------|-----------|---------|
| index.tsx | **23** | 3 | 2 | 0 |
| note/[id].tsx | **16** | 3 | 3 | 0 |
| settings.tsx | 2 | 0 | 0 | 0 |
| archived.tsx | 2 | 2 | 0 | 0 |

**Observation:** `index.tsx` and `note/[id].tsx` have very high state density.

---

## 5. Storage Layers

### 5.1 SQLite Database (expo-sqlite)

| Property | Value |
|----------|-------|
| Database | notes.db |
| Mode | WAL (Write-Ahead Logging) |
| Foreign Keys | Enabled with cascade |

#### Tables

| Table | Columns | Purpose |
|-------|---------|---------|
| notes | id, title, created_at, updated_at, archived, category_id | Note metadata |
| blocks | id, note_id, type, content, order, created_at, updated_at | Note content blocks |
| categories | id, title, color, position, created_at | Note categorization |

#### Block Types
- text, title, subtitle, quote, list, checklist, image

### 5.2 AsyncStorage Keys

| Key | Purpose |
|-----|---------|
| @notes_view_mode | Grid/list preference |
| @tome_nota_language | Language preference (en, pt-BR) |
| @app_theme_mode | Theme preference (system, light, dark) |
| @ad_manager | Ad rate limiting state |
| @ux.slash_used | Slash command usage tracking |
| @ux.slash_hint_dismissed | Hint dismissal state |
| @ux.blocks_edited_count | Edit counter for hints |
| @ux.hint_list_shown | List hint shown flag |
| @ux.hint_checklist_shown | Checklist hint shown flag |

### 5.3 File System Storage

| Path | Purpose |
|------|---------|
| documentDirectory/images/{noteId}/ | User images |
| {imageId}.jpg | Full-size compressed image |
| {imageId}_thumb.jpg | Thumbnail image |

---

## 6. Asset Strategy

### 6.1 App Icons

| File | Size | Notes |
|------|------|-------|
| icon.png | 142KB | App icon |
| android-icon-foreground.png | 142KB | Adaptive icon |
| android-icon-monochrome.png | 142KB | Monochrome variant |
| android-icon-background.png | 274B | Solid color background |
| splash-icon.png | 142KB | Splash screen icon |
| splash-text.png | 142KB | Splash screen text |

**Observation:** Icon files are relatively large at 142KB each.

### 6.2 Vector Icons

| Library | Usage |
|---------|-------|
| @expo/vector-icons (Ionicons) | All UI icons |

### 6.3 User Images

| Setting | Value |
|---------|-------|
| Compression Quality | 0.8 (80%) |
| Thumbnail Quality | 0.6 (60%) |
| Max Width (Landscape) | 2048px |
| Max Width (Portrait) | 1536px |
| Thumbnail Width | 400px |
| Format | JPEG only |

---

## 7. Heavy Screens & Flows

### 7.1 Notes List Screen (index.tsx)

| Metric | Value | Risk |
|--------|-------|------|
| Lines of Code | 1,532 | HIGH |
| useState Hooks | 23 | HIGH |
| Modals | 5 | MEDIUM |
| FlatLists | 3 | MEDIUM |

**Features:**
- Notes list with preview (text from first block)
- Category horizontal scroll
- Search functionality
- Grid/list view toggle
- Swipeable actions (archive, delete)
- Category CRUD modals
- Note selection modal
- Undo toast system
- Banner ad

### 7.2 Note Editor Screen (note/[id].tsx)

| Metric | Value | Risk |
|--------|-------|------|
| Lines of Code | 886 | HIGH |
| useState Hooks | 16 | HIGH |
| Block Types | 7 | MEDIUM |
| Keyboard Handling | Complex | MEDIUM |

**Features:**
- Block-based editor
- Multiple block types with transformation
- Image capture and insertion
- Category picker
- Block insert/delete with undo
- Markdown shortcut detection
- Keyboard-aware scrolling
- Interstitial ad on exit

### 7.3 Image Handling

| Operation | Complexity | Risk |
|-----------|------------|------|
| Image Picker | Low | LOW |
| Image Processing | Medium | MEDIUM |
| Image Storage | Medium | LOW |
| Image Viewer | Medium | LOW |

---

## 8. Performance-Critical Components

### 8.1 List Rendering

| Component | Library | Optimization |
|-----------|---------|--------------|
| Notes List | FlatList | None |
| Category Badges | ScrollView | None |
| Archived List | FlatList | None |
| Category Reorder | FlatList | None |
| Note Selection | FlatList | None |

**Observation:** No FlashList usage. All lists use standard FlatList.

### 8.2 Block Components

| Component | Lines | useState | useEffect | memo |
|-----------|-------|----------|-----------|------|
| TextBlock | ~300 | 5 | 4 | NO |
| ChecklistBlock | ~250 | 2 | 2 | NO |
| ListBlock | ~220 | 2 | 2 | NO |
| TitleBlock | ~150 | 2 | 2 | NO |
| SubtitleBlock | ~150 | 2 | 2 | NO |
| QuoteBlock | ~130 | 2 | 2 | NO |
| ImageBlock | ~120 | 2 | 0 | NO |
| BlockRenderer | ~140 | 0 | 0 | NO |

**Observation:** Zero memoization across all block components.

### 8.3 Image Components

| Component | Library | Features |
|-----------|---------|----------|
| ImageBlock | expo-image | Thumbnail, aspect ratio |
| ImageViewer | expo-image + reanimated | Pinch-zoom, pan gestures |

---

## 9. Third-Party Libraries

### 9.1 Core Dependencies (Low Risk)

| Library | Version | Purpose | Risk |
|---------|---------|---------|------|
| expo | ~54.0.33 | Framework | LOW |
| react | 19.1.0 | UI Library | LOW |
| react-native | 0.81.5 | Native bridge | LOW |
| expo-router | ~6.0.23 | Navigation | LOW |
| expo-sqlite | ~16.0.10 | Database | LOW |

### 9.2 UI Libraries (Low Risk)

| Library | Version | Purpose | Risk |
|---------|---------|---------|------|
| react-native-gesture-handler | ~2.28.0 | Gestures | LOW |
| react-native-reanimated | ~4.1.1 | Animations | LOW |
| react-native-screens | ~4.16.0 | Native screens | LOW |
| react-native-safe-area-context | ~5.6.0 | Safe areas | LOW |
| @expo/vector-icons | ^15.0.3 | Icons | LOW |

### 9.3 Feature Libraries (Medium Risk)

| Library | Version | Purpose | Risk | Notes |
|---------|---------|---------|------|-------|
| expo-image | ~3.0.11 | Images | LOW | Optimized, good choice |
| expo-image-picker | ~17.0.10 | Camera/gallery | LOW | |
| expo-image-manipulator | ~14.0.8 | Image processing | MEDIUM | CPU intensive |
| react-native-google-mobile-ads | ^16.0.3 | Ads | MEDIUM | Native module |

### 9.4 Storage Libraries (Low Risk)

| Library | Version | Purpose | Risk |
|---------|---------|---------|------|
| @react-native-async-storage/async-storage | ^2.2.0 | Key-value storage | LOW |
| expo-file-system | ~19.0.21 | File operations | LOW |

### 9.5 i18n Libraries (Low Risk)

| Library | Version | Purpose | Risk |
|---------|---------|---------|------|
| i18next | ^25.8.0 | i18n core | LOW |
| react-i18next | ^16.5.4 | React bindings | LOW |
| expo-localization | ~17.0.8 | Device locale | LOW |

### 9.6 Utility Libraries (Low Risk)

| Library | Version | Purpose | Risk |
|---------|---------|---------|------|
| expo-crypto | ~15.0.8 | UUID generation | LOW |
| expo-haptics | ~15.0.8 | Haptic feedback | LOW |
| expo-constants | ~18.0.13 | App constants | LOW |

---

## 10. React Hook Usage Summary

| Hook | Count | Files |
|------|-------|-------|
| useState | 74 | 17 |
| useEffect | 25 | 11 |
| useCallback | 10 | 4 |
| useMemo | 2 | 1 |
| React.memo | **0** | 0 |
| useReducer | 0 | 0 |

---

## 11. Build Configuration

### EAS Build Profiles

| Profile | Distribution | Android | Notes |
|---------|--------------|---------|-------|
| development | internal | dev client | Dev package suffix |
| preview | internal | APK | Preview package suffix |
| preview-ads-on | internal | APK | Ads enabled |
| preview-ads-off | internal | APK | Ads disabled |
| production | store | AAB | Auto-increment version |

### Experiments Enabled

- `typedRoutes: true` — Type-safe navigation
- `reactCompiler: true` — React Compiler (automatic memoization)
- `newArchEnabled: true` — Fabric + TurboModules

---

## 12. Code Metrics Summary

| Metric | Value |
|--------|-------|
| Total TypeScript Files | 41 |
| Total Lines (estimated) | ~8,000 |
| Largest File | index.tsx (1,532 lines) |
| Second Largest | note/[id].tsx (886 lines) |
| Components | 12 |
| Screens | 4 |
| Context Providers | 3 |
| Custom Hooks | 3 |

---

## 13. Identified Strengths

1. **expo-image** used for all images (optimized rendering)
2. **React Compiler enabled** (automatic optimization potential)
3. **New Architecture enabled** (Fabric + TurboModules)
4. **Strict TypeScript** enabled
5. **SQLite with WAL mode** (concurrent reads)
6. **Debounced database saves** (reduced writes)
7. **Image compression** (storage optimization)
8. **Haptic feedback** (good UX)
9. **Dark mode support** (system-aware)
10. **i18n support** (English + Portuguese)

---

## 14. Identified Concerns (For Phase 2)

| Area | Concern | Severity |
|------|---------|----------|
| Lists | No FlashList usage | MEDIUM |
| Memoization | Zero React.memo usage | HIGH |
| File Size | index.tsx has 1,532 lines | HIGH |
| State | 23 useState in single component | HIGH |
| Assets | 142KB icon files | LOW |
| useCallback | Only 10 usages across entire app | MEDIUM |
| useMemo | Only 2 usages across entire app | MEDIUM |

---

## 15. Files Inventory

### App Directory
- `app/_layout.tsx` (75 lines)
- `app/index.tsx` (1,532 lines)
- `app/note/[id].tsx` (886 lines)
- `app/settings.tsx` (350 lines)
- `app/archived.tsx` (240 lines)

### Components Directory
- `components/BlockRenderer.tsx` (~140 lines)
- `components/TextBlock.tsx` (~300 lines)
- `components/ChecklistBlock.tsx` (~250 lines)
- `components/ListBlock.tsx` (~220 lines)
- `components/TitleBlock.tsx` (~150 lines)
- `components/SubtitleBlock.tsx` (~150 lines)
- `components/QuoteBlock.tsx` (~130 lines)
- `components/ImageBlock.tsx` (~120 lines)
- `components/BlockTypeMenu.tsx` (~100 lines)
- `components/ImageSourceMenu.tsx` (~80 lines)
- `components/ImageViewer.tsx` (~150 lines)
- `components/BannerAdView.tsx` (~50 lines)

### Lib Directory
- `lib/db.ts` (12 lines)
- `lib/migrations.ts` (95 lines)
- `lib/notes.repository.ts` (153 lines)
- `lib/blocks.repository.ts` (149 lines)
- `lib/categories.repository.ts` (73 lines)
- `lib/images.service.ts` (112 lines)
- `lib/title.ts` (exists)
- `lib/i18n/index.ts` (66 lines)
- `lib/i18n/resources.ts` (13 lines)
- `lib/i18n/locales/en.ts` (128 lines)
- `lib/i18n/locales/pt-BR.ts` (128 lines)
- `lib/theme/index.ts` (exports)
- `lib/theme/colors.ts` (102 lines)
- `lib/theme/ThemeContext.tsx` (79 lines)
- `lib/ads/index.ts` (exports)
- `lib/ads/AdManager.ts` (94 lines)
- `lib/ads/googleMobileAds.ts` (17 lines)
- `lib/ads/useAds.ts` (113 lines)
- `lib/premium/index.ts` (exports)
- `lib/premium/PremiumContext.tsx` (31 lines)
- `lib/ux/hints.ts` (110 lines)

### Hooks Directory
- `hooks/useImagePicker.ts` (80 lines)

---

## Phase 1 Complete

**Status:** INVENTORY COMPLETE
**Next Phase:** Phase 2 — Performance Risk Analysis
**Awaiting:** User confirmation to proceed
