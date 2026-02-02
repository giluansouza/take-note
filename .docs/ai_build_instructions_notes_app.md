# AI Build Instructions — Minimal Notes App (React Native + Expo)

## 1. Project Overview

Build a **minimal, offline-first notes application** using **React Native + Expo**.
The app is designed for **personal, instant use**, focusing on speed, simplicity, and zero friction.

Core concept:
- A **Note** has a title
- Inside a Note, content is organized into **Sections**
- Each Section can contain:
  - Titles
  - Subtitles
  - Plain text blocks
  - Lists
  - Checkboxes

No backend, no authentication, no sync in the MVP.
All data is stored locally using SQLite.

---

## 2. Non-Goals (Explicitly Excluded)

The following features must NOT be implemented in the MVP:
- User accounts or authentication
- Cloud sync
- Collaboration
- Tags or labels
- Rich text editors (WYSIWYG)
- Markdown rendering
- Search or filtering
- Sharing or exporting

---

## 3. Technology Stack

- Framework: Expo (React Native)
- Language: TypeScript
- Navigation: Expo Router
- Local Database: SQLite (`expo-sqlite`)
- State Management: React state + hooks only
- Styling: React Native StyleSheet (no UI frameworks)
- Platform target: Android first (iOS compatible by default)

---

## 4. Project Initialization

1. Create project:
```bash
npx create-expo-app notes-app
cd notes-app
```

2. Install dependencies:
```bash
expo install expo-sqlite
expo install expo-router
expo install expo-haptics
```

3. Enable Expo Router structure.

---

## 5. Folder Structure

```
app/
 ├─ index.tsx              # Notes list screen
 ├─ note/[id].tsx          # Note detail screen
 ├─ _layout.tsx            # Router layout
lib/
 ├─ db.ts                  # SQLite initialization
 ├─ migrations.ts          # DB schema creation
 ├─ notes.repository.ts    # Notes queries
 ├─ sections.repository.ts # Sections queries
 ├─ blocks.repository.ts   # Content blocks queries
components/
 ├─ Section.tsx
 ├─ BlockRenderer.tsx
 ├─ TextBlock.tsx
 ├─ ChecklistBlock.tsx
 └─ ListBlock.tsx
```

---

## 6. Data Model (SQLite)

### 6.1 Notes Table

```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 6.2 Sections Table

```sql
CREATE TABLE sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  title TEXT,
  subtitle TEXT,
  position INTEGER NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

### 6.3 Blocks Table

A block represents a piece of content inside a section.

```sql
CREATE TABLE blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- text | checklist | list
  content TEXT,       -- JSON or plain text depending on type
  position INTEGER NOT NULL,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);
```

### 6.4 Checklist Items (Embedded)

Checklist items are stored as JSON inside `blocks.content`:

```json
[
  { "id": 1, "text": "Item 1", "done": false },
  { "id": 2, "text": "Item 2", "done": true }
]
```

---

## 7. UI Structure

### 7.1 Notes List Screen (`index.tsx`)

- Displays a vertical list of notes
- Each item shows:
  - Note title
  - Creation date (small)
- Floating Action Button (+) creates a new note
- Tap opens note detail screen

---

### 7.2 Note Detail Screen (`note/[id].tsx`)

Layout order:

1. Editable Note Title (TextInput)
2. Vertical list of Sections
3. Button: "Add Section"

---

### 7.3 Section Layout

Each section visually represents:

```
-----------------------------
SECTION TITLE
SECTION SUBTITLE

[ Text block ]
[ Checklist block ]
[ List block ]
-----------------------------
```

Rules:
- Title and subtitle are optional
- Blocks are ordered by `position`
- Each section is independent

---

## 8. Content Blocks

### 8.1 Text Block

- Single multiline TextInput
- Autosave on blur or debounce

### 8.2 Checklist Block

- Vertical list of checkboxes
- Each item:
  - Checkbox
  - Editable text
- Enter creates a new item
- Empty backspace deletes item
- Haptic feedback on toggle

### 8.3 List Block

- Bullet-style list
- No checkbox
- Same behavior as checklist without `done`

---

## 9. Autosave Strategy

All edits must be autosaved automatically.

Rules:
- Use debounce (300–500ms) before writing to SQLite
- No explicit save button
- UI must never block on DB operations

Flow:
```
User Input
→ Local State Update
→ Debounce
→ SQLite Update
```

---

## 10. UX Rules (Strict)

- App must open in < 1 second
- No splash screens
- No loading spinners for local data
- Keyboard-first interactions
- Focus new inputs automatically
- Minimal animations

---

## 11. Styling Guidelines

- White background
- Black text
- Very subtle separators
- No icons unless necessary
- No shadows
- Typography-focused UI

---

## 12. Error Handling

- No modal alerts
- Fail silently on DB errors
- Log errors to console only

---

## 13. MVP Completion Criteria

The MVP is complete when:
- Notes can be created and opened
- Sections can be added to notes
- Sections support title, subtitle, and blocks
- Text, list, and checklist blocks work
- All content persists after app restart
- No crashes during normal usage

---

## 14. Future Extensions (DO NOT IMPLEMENT)

- Cloud sync
- Encryption
- Search
- Tags
- Export
- Multi-device sync

---

## 15. Guiding Principle

> Build the smallest thing that you would actually use every day.

Speed, clarity, and reliability are more important than features.

