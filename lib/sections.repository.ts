import { getDatabase } from './db';

export interface Section {
  id: number;
  note_id: number;
  title: string | null;
  subtitle: string | null;
  position: number;
}

export async function getSectionsByNoteId(noteId: number): Promise<Section[]> {
  const db = await getDatabase();
  return db.getAllAsync<Section>(
    'SELECT * FROM sections WHERE note_id = ? ORDER BY position ASC',
    [noteId]
  );
}

export async function createSection(noteId: number, position: number): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO sections (note_id, title, subtitle, position) VALUES (?, ?, ?, ?)',
    [noteId, null, null, position]
  );
  return result.lastInsertRowId;
}

export async function updateSectionTitle(id: number, title: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE sections SET title = ? WHERE id = ?', [title, id]);
}

export async function updateSectionSubtitle(id: number, subtitle: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE sections SET subtitle = ? WHERE id = ?', [subtitle, id]);
}

export async function deleteSection(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sections WHERE id = ?', [id]);
}
