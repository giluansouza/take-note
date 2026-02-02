import { getDatabase } from './db';

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      title TEXT,
      subtitle TEXT,
      position INTEGER NOT NULL,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      position INTEGER NOT NULL,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    );
  `);

  // Migration: add archived column if it doesn't exist
  const tableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(notes)"
  );
  const hasArchived = tableInfo.some((col) => col.name === "archived");
  if (!hasArchived) {
    await db.execAsync("ALTER TABLE notes ADD COLUMN archived INTEGER NOT NULL DEFAULT 0");
  }

  // Migration: add categories table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      color TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // Migration: add category_id to notes
  const hasCategoryId = tableInfo.some((col) => col.name === "category_id");
  if (!hasCategoryId) {
    await db.execAsync("ALTER TABLE notes ADD COLUMN category_id INTEGER REFERENCES categories(id)");
  }
}
