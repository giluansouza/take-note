# Feature Implementation Plan — Tome Nota v2

## Overview

This document tracks all features for Tome Nota, including what's already implemented, what's planned for upcoming sprints, and what's reserved for future development.

---

## Implemented Features (Current State)

The following features are **complete and functional** in the current codebase:

### Core Note Management
| Feature | Status | Notes |
|---------|--------|-------|
| Create notes | ✅ Done | Tap FAB to create new note |
| Edit note title | ✅ Done | Inline editing with autosave |
| Delete notes | ✅ Done | Swipe left or delete button in detail |
| Archive notes | ✅ Done | Swipe right to archive |
| Notes list view | ✅ Done | Sorted by updated_at descending |

### Sections
| Feature | Status | Notes |
|---------|--------|-------|
| Add sections to notes | ✅ Done | Multiple sections per note |
| Section title | ✅ Done | Optional, editable |
| Section subtitle | ✅ Done | Optional, editable |
| Delete sections | ✅ Done | X button on section |
| Section ordering | ✅ Done | By position field |

### Content Blocks
| Feature | Status | Notes |
|---------|--------|-------|
| Text block | ✅ Done | Multiline text input |
| Checklist block | ✅ Done | Checkboxes with toggle |
| List block | ✅ Done | Bullet-style list |
| Add blocks to sections | ✅ Done | Text, checklist, or list |
| Delete blocks | ✅ Done | X button on block |
| Block ordering | ✅ Done | By position field |

### Data & Storage
| Feature | Status | Notes |
|---------|--------|-------|
| SQLite local storage | ✅ Done | expo-sqlite |
| Autosave | ✅ Done | 300-500ms debounce |
| Data persistence | ✅ Done | Survives app restart |
| Offline-first | ✅ Done | No network required |

### UX & Polish
| Feature | Status | Notes |
|---------|--------|-------|
| Swipe gestures | ✅ Done | Archive (right), Delete (left) |
| Haptic feedback | ✅ Done | On checkbox toggle |
| Keyboard handling | ✅ Done | Enter creates items, backspace deletes empty |
| Safe area support | ✅ Done | Status bar handled |
| Fast startup | ✅ Done | < 1 second target |

### Technical Infrastructure
| Feature | Status | Notes |
|---------|--------|-------|
| Expo Router navigation | ✅ Done | Stack navigation |
| TypeScript | ✅ Done | Full type coverage |
| Database migrations | ✅ Done | Schema versioning |
| Repository pattern | ✅ Done | Separated data access |

---

## MVP Readiness Analysis

### Original MVP Criteria (from build instructions)

| Criterion | Status |
|-----------|--------|
| Notes can be created and opened | ✅ Met |
| Sections can be added to notes | ✅ Met |
| Sections support title, subtitle, and blocks | ✅ Met |
| Text, list, and checklist blocks work | ✅ Met |
| All content persists after app restart | ✅ Met |
| No crashes during normal usage | ✅ Met |

**Result: Core MVP criteria are satisfied.**

---

### Production Readiness Assessment

However, for a **production-ready release** on app stores, additional polish is recommended:

#### Required for Production Release

| Item | Status | Priority |
|------|--------|----------|
| Settings screen (basic) | ❌ Missing | **High** |
| Delete confirmation dialog | ❌ Missing | **High** |
| Archived notes view | ❌ Missing | **High** |
| Empty state improvements | ⚠️ Basic | Medium |
| App icon finalized | ⚠️ Placeholder | **High** |
| Privacy policy | ❌ Missing | **High** (store requirement) |
| Terms of service | ❌ Missing | **High** (store requirement) |
| Error boundaries | ❌ Missing | Medium |
| Loading states | ⚠️ Basic | Medium |

#### Recommended Before Production

| Item | Status | Priority |
|------|--------|----------|
| Onboarding / first-run experience | ❌ Missing | Medium |
| Pull-to-refresh on notes list | ❌ Missing | Low |
| Note search | ❌ Missing | Medium |
| Undo delete / undo archive | ❌ Missing | Medium |
| About screen | ❌ Missing | Low |
| Rate app prompt | ❌ Missing | Low |

---

### MVP Release Recommendation

#### Option A: Minimal Release (1-2 weeks)
Release with core features only. Add these essentials:

1. **Settings screen** — Language selection, about, privacy policy link
2. **Archived notes view** — Access archived notes
3. **Delete confirmation** — "Are you sure?" dialog
4. **Privacy policy** — Required for app stores
5. **Final app icon** — Replace placeholder

This creates a functional, releasable product that matches the "minimal notes app" vision.

#### Option B: Enhanced Release (3-4 weeks)
Include everything from Option A, plus:

1. **Categories & Tags** (Sprint 1) — Adds organizational value
2. **Search** — Find notes quickly
3. **Onboarding** — Brief intro for new users
4. **Undo actions** — Safety net for accidental deletes

This creates a more competitive product with better retention potential.

---

### Recommendation

**Go with Option A (Minimal Release)** to validate the product quickly:

- Aligns with "build the smallest thing you'd use every day"
- Faster time to market
- Gather real user feedback before adding complexity
- Categories/Tags can be added in first update

**Pre-release checklist for Option A:**
- [ ] Settings screen with language picker
- [ ] Archived notes screen
- [ ] Delete confirmation dialogs
- [ ] Privacy policy page/URL
- [ ] Terms of service page/URL
- [ ] Final app icon and splash screen
- [ ] Test on multiple Android devices
- [ ] Performance audit (startup time)
- [ ] Create store listing assets

---

## Planned Features (Upcoming Sprints)

The following features are planned for implementation after the initial release:

| # | Feature | Sprint | Priority |
|---|---------|--------|----------|
| 1 | Categories & Tags | Sprint 1 | High |
| 2 | Account Creation (Google/Email) | Sprint 2 | High |
| 3 | Image Support | Sprint 3 | High |
| 4 | Dual Listing Views (List + Album) | Sprint 4 | Medium |
| 5 | Location/Address Blocks | Sprint 5 | Medium |

---

## Feature Analysis (Planned Features)

### P1. Categories & Tags

See **Sprint 1** in Sprint Planning section for full details.

---

### P2. Account Creation (Google/Email)

**Complexity:** High
**Dependencies:** None (foundational)

**Requirements:**
- Email/password authentication
- Google OAuth integration
- User profile storage
- Session management
- Password reset flow

**Technical Considerations:**
- Use Firebase Auth or Supabase for backend
- Secure token storage (expo-secure-store)
- Handle offline-first with eventual sync
- Migration path for existing local-only data

---

### P3. Image Support in Notes

**Complexity:** High
**Dependencies:** Account creation (for cloud storage)

**Requirements:**
- Image picker (camera + gallery)
- Image compression/optimization
- Local storage with cloud backup
- Thumbnail generation
- New "image" block type
- Image viewing (full screen, zoom)

**Technical Considerations:**
- expo-image-picker for selection
- expo-file-system for local storage
- Cloud storage (Firebase Storage / Supabase Storage)
- Generate thumbnails on device before upload
- Lazy loading for performance

**Data Model:**
```sql
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id INTEGER,
  local_uri TEXT NOT NULL,
  remote_uri TEXT,
  thumbnail_uri TEXT,
  width INTEGER,
  height INTEGER,
  uploaded INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
);
```

---

### P4. Dual Listing Views (List + Album)

**Complexity:** Medium
**Dependencies:** Image support (for album thumbnails)

**Requirements:**
- Toggle between List and Album views
- List view: current implementation with swipe actions
- Album view: card grid with image thumbnails
- Persist user's view preference
- Smooth transition between views

**Technical Considerations:**
- FlatList with numColumns for album grid
- Extract first image from note as thumbnail
- Fallback placeholder for notes without images
- ViewabilityConfig for performance

**UI Specifications:**
- List view: Title + date + swipe actions (existing)
- Album view: 2-column grid, card with image (16:9), title below
- Toggle button in header

---

### P5. Category Support

**Complexity:** Medium
**Dependencies:** None

**Requirements:**
- Create/edit/delete categories
- Assign one category per note
- Category has title and optional color
- Filter notes by category
- Category management screen

**Data Model:**
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  color TEXT,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

-- Add to notes table:
ALTER TABLE notes ADD COLUMN category_id INTEGER REFERENCES categories(id);
```

---

### P6. Tag Support

**Complexity:** Medium
**Dependencies:** None

**Requirements:**
- Create/edit/delete tags
- Assign multiple tags per note
- Tag has title and optional color
- Filter notes by tag(s)
- Tag management screen
- Inline tag creation while editing

**Data Model:**
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE note_tags (
  note_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

---

### P7. Location/Address Support

**Complexity:** Medium
**Dependencies:** None

**Requirements:**
- New "location" block type
- Address input with autocomplete
- Current location detection
- Display map preview in note
- Tap to open in Maps app
- Store coordinates + formatted address

**Technical Considerations:**
- expo-location for current position
- Google Places API for autocomplete
- react-native-maps for preview (or static map image)
- Deep linking to Maps apps (Google Maps, Apple Maps, Waze)

**Data Model:**
```sql
CREATE TABLE locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id INTEGER NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT,
  place_name TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
);
```

---

## Sprint Planning

### Sprint 1: Categories & Tags (Foundation for Organization)
**Duration:** 1-2 weeks
**Priority:** High

**Rationale:** These are data model extensions that don't require external services. They provide immediate value for note organization and establish patterns for metadata management.

**UX Principle:** No separate management screens. All category/tag operations happen inline when adding them to a note:
- Type to search existing items or create new ones
- Long-press to edit (rename, change color, delete)
- Inline color picker during creation/editing
- Swipe to remove from note (without deleting the category/tag itself)

**Tasks:**
1. Database migrations for categories and tags tables
2. Category repository (CRUD operations)
3. Tag repository (CRUD operations)
4. Note-tag relationship repository
5. Inline color picker component
6. CategorySelector component:
   - Search/filter existing categories
   - Create new category inline (name + color)
   - Long-press to edit/delete category
   - Single selection (one category per note)
7. TagSelector component:
   - Search/filter existing tags
   - Create new tag inline (name + color)
   - Long-press to edit/delete tag
   - Multi-selection (many tags per note)
   - Display as chips with remove button
8. Add category/tag section to note detail screen
9. Display category indicator in note list items
10. Display tag chips in note list items
11. Filter notes by category (tap category in list)
12. Filter notes by tag (tap tag in list)
13. Handle orphan cleanup (delete unused categories/tags option)

**UI Flow - Adding a Tag:**
```
[+ Add Tag] button
    ↓
Bottom sheet opens with:
    - Search input (auto-focused)
    - List of existing tags (filtered by search)
    - "Create [search term]" option if no exact match
    ↓
Tap existing tag → added to note, sheet closes
Tap "Create [term]" → color picker appears inline → confirm → tag created & added
Long-press any tag → edit mode (rename, recolor, delete)
```

**UI Flow - Adding a Category:**
```
[Category: None] or [Category: Work] button
    ↓
Bottom sheet opens with:
    - Search input
    - List of existing categories
    - "Create [search term]" option
    - "None" option to remove category
    ↓
Same interaction pattern as tags, but single-select
```

**Deliverables:**
- Users can create, edit, delete categories and tags inline
- Users can assign category and tags to notes without leaving the note
- Users can filter notes by tapping category/tag in list view

---

### Sprint 2: Account Creation & Authentication
**Duration:** 2-3 weeks
**Priority:** High

**Rationale:** Authentication is required before implementing cloud-dependent features like image storage and cross-device sync.

**Tasks:**
1. Choose and set up backend (Firebase/Supabase)
2. Configure Google OAuth credentials
3. Install auth dependencies (expo-auth-session, expo-secure-store)
4. Create auth context/provider
5. Email signup screen
6. Email login screen
7. Google sign-in integration
8. Password reset flow
9. User profile screen
10. Logout functionality
11. Session persistence
12. Associate existing local data with new account
13. Auth state in app navigation (protected routes)

**Deliverables:**
- Users can create account with email or Google
- Users can sign in/out
- Session persists across app restarts

---

### Sprint 3: Image Support
**Duration:** 2-3 weeks
**Priority:** High

**Rationale:** Images are a major feature enhancement. Requires auth for cloud storage.

**Tasks:**
1. Database migration for images table
2. Image repository (CRUD operations)
3. Add "image" block type
4. Image picker integration (camera + gallery)
5. Image compression utility
6. Thumbnail generation utility
7. Local image storage management
8. ImageBlock component (display in note)
9. Full-screen image viewer with zoom
10. Cloud storage integration (upload/download)
11. Background upload queue
12. Sync status indicators
13. Image deletion (local + cloud)
14. Offline support (show local, sync when online)

**Deliverables:**
- Users can add images to notes
- Images are stored locally and synced to cloud
- Images display in notes with full-screen view option

---

### Sprint 4: Dual Listing Views
**Duration:** 1-2 weeks
**Priority:** Medium

**Rationale:** Depends on image support for album view thumbnails.

**Tasks:**
1. Create view toggle component in header
2. Persist view preference (AsyncStorage)
3. Extract note thumbnail utility (first image or placeholder)
4. NoteCard component for album view
5. Album view grid layout (2 columns)
6. Maintain swipe actions in list view only
7. Tap behavior consistent across views
8. Empty state for both views
9. Loading states for both views
10. Smooth animated transition between views

**Deliverables:**
- Users can switch between list and album views
- Album view shows image thumbnails in card grid
- View preference persists

---

### Sprint 5: Location/Address Support
**Duration:** 1-2 weeks
**Priority:** Medium

**Rationale:** Independent feature that adds value for specific use cases (travel notes, meeting locations, etc.).

**Tasks:**
1. Database migration for locations table
2. Location repository (CRUD operations)
3. Add "location" block type
4. expo-location setup and permissions
5. Current location detection
6. Google Places API integration
7. Address autocomplete component
8. LocationBlock component (display in note)
9. Static map preview (or react-native-maps)
10. Deep link to Maps apps
11. Location deletion

**Deliverables:**
- Users can add locations to notes
- Locations show address and map preview
- Tapping location opens navigation app

---

## Implementation Order Summary

```
Sprint 1: Categories & Tags
    ↓
Sprint 2: Account & Authentication
    ↓
Sprint 3: Image Support
    ↓
Sprint 4: Dual Listing Views
    ↓
Sprint 5: Location Support
```

**Rationale for Order:**

1. **Categories & Tags first:** No external dependencies, immediate organizational value, establishes patterns for data extensions.

2. **Authentication second:** Required foundation for cloud features. Better to implement before images to avoid retrofitting.

3. **Images third:** Major feature that benefits from cloud storage (requires auth). High user value.

4. **Dual Views fourth:** Depends on images for album view thumbnails. Polish feature that enhances existing functionality.

5. **Location last:** Independent feature with narrower use case. Can be implemented in parallel if resources allow.

---

## Technical Debt & Considerations

### Before Starting
- [ ] Set up proper error handling/logging service
- [ ] Add analytics tracking
- [ ] Implement proper loading states throughout app
- [ ] Add pull-to-refresh on notes list

### During Implementation
- [ ] Write unit tests for repositories
- [ ] Write integration tests for critical flows
- [ ] Document API contracts
- [ ] Performance profiling for image handling

### Future Considerations (Not in Scope)
- Cloud sync for notes content
- Collaboration/sharing
- Rich text editing
- Search functionality
- Export/import
- Encryption

---

## Future Features (Not in Current Sprints)

The following features are planned for future implementation but are not included in the current sprint planning.

### F1. Audio Support in Notes

**Complexity:** High
**Status:** Planned (future)

**Requirements:**
- New "audio" block type
- Record audio directly in app
- Import audio files
- Audio playback with controls (play, pause, seek)
- Waveform visualization
- Audio compression
- Cloud storage for audio files

**Technical Considerations:**
- `expo-av` for recording and playback
- Audio format: AAC or M4A for compression/compatibility
- Consider maximum recording duration (storage concerns)
- Background audio handling
- Transcription integration (future enhancement)

**Data Model:**
```sql
CREATE TABLE audio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id INTEGER NOT NULL,
  local_uri TEXT NOT NULL,
  remote_uri TEXT,
  duration_ms INTEGER NOT NULL,
  file_size INTEGER,
  uploaded INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
);
```

**UI Considerations:**
- Recording button with visual feedback (pulsing, duration)
- Inline player with play/pause, progress bar, duration
- Option to delete or re-record

---

### F2. URL/Link Support in Notes

**Complexity:** Low-Medium
**Status:** Planned (future)

**Requirements:**
- New "link" block type
- URL input with validation
- Automatic metadata fetching (title, description, image)
- Link preview card display
- Tap to open in browser
- Manual title override option

**Technical Considerations:**
- URL validation regex
- Open Graph / meta tag parsing for previews
- Cache link previews locally
- Handle broken/invalid URLs gracefully
- `expo-web-browser` for opening links

**Data Model:**
```sql
CREATE TABLE links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT,
  favicon_url TEXT,
  fetched_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
);
```

**UI Considerations:**
- Link preview card: favicon + title + description + thumbnail
- Loading state while fetching metadata
- Fallback display for URLs without metadata
- Edit option to manually set title

---

### F3. Calendar-Based Notes

**Complexity:** High
**Status:** Requires Research

**Concept:**
Notes that are associated with specific dates or date ranges, enabling calendar-based organization and viewing.

**Potential Approaches:**

#### Approach A: Date-Tagged Notes
- Add optional date/time field to notes
- Calendar view shows notes on their assigned dates
- Simple implementation, extends existing note model

#### Approach B: Daily Notes / Journal Mode
- One note per day (auto-created)
- Calendar navigates between daily notes
- Similar to journaling apps (Day One, Journey)

#### Approach C: Event-Linked Notes
- Integration with device calendar
- Notes linked to calendar events
- View notes alongside schedule

#### Approach D: Full Calendar Integration
- Create calendar events from notes
- Bi-directional sync with Google Calendar / Apple Calendar
- Complex but powerful

**Research Required:**
- [ ] User research: What calendar-note workflows do users need?
- [ ] Competitive analysis: How do Notion, Obsidian, Roam handle dates?
- [ ] Technical feasibility of calendar API integrations
- [ ] Impact on existing note model and navigation
- [ ] Performance implications of date-based queries

**Questions to Answer:**
1. Should dates be a property of notes, or should "calendar notes" be a separate type?
2. Is this a viewing/filtering feature, or a core data model change?
3. Do we need recurring notes (weekly review, daily standup)?
4. How does this interact with categories and tags?
5. Should notes appear in the device's native calendar app?

**Preliminary Data Model (Approach A):**
```sql
-- Add to notes table:
ALTER TABLE notes ADD COLUMN date_start TEXT;      -- ISO date or datetime
ALTER TABLE notes ADD COLUMN date_end TEXT;        -- For date ranges (optional)
ALTER TABLE notes ADD COLUMN is_all_day INTEGER;   -- 1 = date only, 0 = specific time
ALTER TABLE notes ADD COLUMN recurrence TEXT;      -- JSON for recurring rules (future)
```

**Dependencies:**
- May require: `expo-calendar` for device calendar integration
- May require: Custom calendar UI component or `react-native-calendars`

**Recommendation:**
Start with **Approach A** (date-tagged notes with calendar view) as MVP. This provides value without over-complicating the data model. More advanced integrations can be added incrementally.

---

### F4. Financial Tracking in Notes

**Complexity:** High
**Status:** Partially Requires Research

**Concept:**
Add financial tracking capabilities to notes, allowing users to log expenses, income, and view simple charts. Optionally includes investment tracking (requires product research).

---

#### Part A: Expense & Income Tracking (Planned)

**Requirements:**
- New "transaction" block type
- Log expenses and income with:
  - Amount
  - Type (expense/income)
  - Category (food, transport, utilities, salary, etc.)
  - Date
  - Optional description
- Summary view within note (total income, total expenses, balance)
- Simple charts (pie chart by category, bar chart over time)
- Currency support (user preference)

**Use Cases:**
- Trip expense tracking (travel note with all costs)
- Project budget tracking
- Monthly expense log
- Event cost breakdown (wedding, party, renovation)

**Technical Considerations:**
- Chart library: `react-native-chart-kit` or `victory-native`
- Currency formatting with locale support
- Aggregate calculations (sum, average, by category)
- Export to CSV (future)

**Data Model:**
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id INTEGER NOT NULL,
  type TEXT NOT NULL,              -- 'expense' | 'income'
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT,
  description TEXT,
  transaction_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
);

CREATE TABLE transaction_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,              -- 'expense' | 'income' | 'both'
  icon TEXT,
  color TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
```

**Default Categories:**
| Expense | Income |
|---------|--------|
| Food & Dining | Salary |
| Transportation | Freelance |
| Shopping | Investment Return |
| Entertainment | Gift |
| Bills & Utilities | Refund |
| Health | Other |
| Travel | |
| Other | |

**UI Components:**
- TransactionBlock: List of transactions with add button
- AddTransactionSheet: Bottom sheet for quick entry
- TransactionSummary: Totals and balance display
- ExpenseChart: Pie/bar chart visualization
- CategoryPicker: Select or create category

**UI Flow - Adding a Transaction:**
```
[+ Add Transaction] button in transaction block
    ↓
Bottom sheet opens:
    - Amount input (numeric keyboard)
    - Type toggle: Expense / Income
    - Category selector
    - Date picker (defaults to today)
    - Description (optional)
    - [Save] button
    ↓
Transaction added to block, summary updates
```

---

#### Part B: Investment Tracking (Requires Research)

**Concept:**
Track investment portfolio performance within notes. Scope and viability need product research.

**Potential Scope Levels:**

##### Level 1: Manual Investment Log (Simple)
- Log buy/sell transactions manually
- Track quantity, price, date
- Calculate basic P&L (profit/loss)
- No real-time data

##### Level 2: Portfolio Snapshot (Medium)
- Manual entry of holdings
- Fetch current prices via API (stocks, crypto)
- Show current value vs. cost basis
- Basic performance charts

##### Level 3: Full Portfolio Tracker (Complex)
- Connect to brokerage accounts
- Automatic transaction import
- Dividends, splits tracking
- Advanced analytics
- Tax reporting

**Research Required:**

- [ ] **Product Research:**
  - Does investment tracking fit Tome Nota's "minimal notes" philosophy?
  - Would this attract users or create scope creep?
  - Competitive analysis: How do Notion, finance apps handle this?

- [ ] **User Research:**
  - Do note-taking users want investment features?
  - What's the minimum viable investment tracking?
  - Survey potential users on desired functionality

- [ ] **Technical Research:**
  - API options for stock/crypto prices (Alpha Vantage, Yahoo Finance, CoinGecko)
  - API costs and rate limits
  - Brokerage API integrations (Plaid, etc.)
  - Regulatory considerations (financial data handling)

- [ ] **Business Research:**
  - Monetization potential (premium-only feature?)
  - Liability concerns with financial features
  - Data accuracy disclaimers needed

**Questions to Answer:**
1. Is Tome Nota the right app for investment tracking, or is this feature creep?
2. What's the user overlap between note-takers and investment trackers?
3. Can we deliver value with manual-only tracking (no APIs)?
4. Should this be a separate "Finance" note type or integrated blocks?
5. How do we handle multiple currencies and exchange rates?
6. What disclaimers/terms are needed for financial features?

**Preliminary Data Model (Level 1 - Manual):**
```sql
CREATE TABLE investments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,            -- 'AAPL', 'BTC', etc.
  name TEXT,                       -- 'Apple Inc.', 'Bitcoin'
  type TEXT NOT NULL,              -- 'stock' | 'crypto' | 'etf' | 'other'
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
);

CREATE TABLE investment_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investment_id INTEGER NOT NULL,
  action TEXT NOT NULL,            -- 'buy' | 'sell' | 'dividend'
  quantity REAL NOT NULL,
  price_per_unit REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  fees REAL DEFAULT 0,
  transaction_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
);
```

**Recommendation:**
1. **Implement Part A (Expense/Income) first** — clear value, fits note-taking use case
2. **Conduct research for Part B** before committing to investment features
3. If investment tracking proceeds, **start with Level 1 (manual log)** and iterate based on user feedback
4. Consider making investment features **Premium-only** due to complexity

---

### Future Features Summary

| ID | Feature | Complexity | Dependencies | Status |
|----|---------|------------|--------------|--------|
| F1 | Audio Support | High | Auth, Cloud Storage | Planned |
| F2 | URL/Link Support | Low-Medium | None | Planned |
| F3 | Calendar-Based Notes | High | Research needed | Requires Analysis |
| F4a | Financial Tracking (Expense/Income) | Medium-High | Charts library | Planned |
| F4b | Financial Tracking (Investments) | High | API research, Legal review | Requires Research |

---

## Dependencies to Install

```bash
# Sprint 1 (Categories & Tags)
# No new dependencies

# Sprint 2 (Authentication)
npx expo install expo-auth-session expo-crypto expo-secure-store expo-web-browser
npm install @react-native-firebase/app @react-native-firebase/auth
# OR
npm install @supabase/supabase-js

# Sprint 3 (Images)
npx expo install expo-image-picker expo-file-system expo-media-library
npm install react-native-image-zoom-viewer

# Sprint 4 (Dual Views)
# No new dependencies

# Sprint 5 (Location)
npx expo install expo-location
npm install react-native-maps
# Google Places API key required
```

---

## Estimated Timeline

| Sprint | Duration | Cumulative |
|--------|----------|------------|
| Sprint 1: Categories & Tags | 1-2 weeks | 1-2 weeks |
| Sprint 2: Authentication | 2-3 weeks | 3-5 weeks |
| Sprint 3: Images | 2-3 weeks | 5-8 weeks |
| Sprint 4: Dual Views | 1-2 weeks | 6-10 weeks |
| Sprint 5: Location | 1-2 weeks | 7-12 weeks |

**Total estimated time: 7-12 weeks**

---

## Success Metrics

- [ ] All features implemented and functional
- [ ] No critical bugs in production
- [ ] App startup time < 1 second maintained
- [ ] Image upload success rate > 99%
- [ ] Authentication flow completion rate > 90%
