import { getDatabase } from './db';

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      "order" REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      color TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // If this is an old schema (section-based), reset the database
  const blocksTableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(blocks)"
  );
  const hasNoteId = blocksTableInfo.some((col) => col.name === "note_id");
  const hasOrder = blocksTableInfo.some((col) => col.name === "order");
  if (blocksTableInfo.length > 0 && (!hasNoteId || !hasOrder)) {
    await db.execAsync(`
      DROP TABLE IF EXISTS blocks;
      DROP TABLE IF EXISTS sections;
      DROP TABLE IF EXISTS notes;
      DROP TABLE IF EXISTS categories;
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        content TEXT,
        "order" REAL NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        color TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);
  }

  const notesTableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(notes)"
  );
  const hasArchived = notesTableInfo.some((col) => col.name === "archived");
  if (!hasArchived) {
    await db.runAsync("ALTER TABLE notes ADD COLUMN archived INTEGER NOT NULL DEFAULT 0");
  }
  const hasCategoryId = notesTableInfo.some((col) => col.name === "category_id");
  if (!hasCategoryId) {
    await db.runAsync(
      "ALTER TABLE notes ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL"
    );
  }
}
