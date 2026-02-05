import { getDatabase } from './db';
import { BlockType } from './blocks.repository';
import { deleteNoteImages } from './images.service';

export interface Note {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  archived: number;
  category_id: number | null;
}

export interface NoteWithPreview extends Note {
  first_block_content?: string | null;
  first_block_type?: BlockType | null;
}

export interface NotesFilter {
  search?: string;
  categoryId?: number | null;
}

export async function getAllNotes(filter?: NotesFilter): Promise<Note[]> {
  const db = await getDatabase();

  let query = 'SELECT * FROM notes WHERE archived = 0';
  const params: (string | number)[] = [];

  if (filter?.search) {
    query += ' AND title LIKE ?';
    params.push(`%${filter.search}%`);
  }

  if (filter?.categoryId !== undefined) {
    if (filter.categoryId === null) {
      query += ' AND category_id IS NULL';
    } else {
      query += ' AND category_id = ?';
      params.push(filter.categoryId);
    }
  }

  query += ' ORDER BY updated_at DESC';

  return db.getAllAsync<Note>(query, params);
}

export async function getAllNotesWithPreview(filter?: NotesFilter): Promise<NoteWithPreview[]> {
  const db = await getDatabase();

  let query = `
    SELECT notes.*,
      (
        SELECT content
        FROM blocks
        WHERE blocks.note_id = notes.id AND blocks.type != 'image'
        ORDER BY blocks."order" ASC
        LIMIT 1
      ) AS first_block_content,
      (
        SELECT type
        FROM blocks
        WHERE blocks.note_id = notes.id AND blocks.type != 'image'
        ORDER BY blocks."order" ASC
        LIMIT 1
      ) AS first_block_type
    FROM notes
    WHERE archived = 0
  `;
  const params: (string | number)[] = [];

  if (filter?.search) {
    query += ' AND title LIKE ?';
    params.push(`%${filter.search}%`);
  }

  if (filter?.categoryId !== undefined) {
    if (filter.categoryId === null) {
      query += ' AND category_id IS NULL';
    } else {
      query += ' AND category_id = ?';
      params.push(filter.categoryId);
    }
  }

  query += ' ORDER BY updated_at DESC';

  return db.getAllAsync<NoteWithPreview>(query, params);
}

export async function getArchivedNotes(): Promise<Note[]> {
  const db = await getDatabase();
  return db.getAllAsync<Note>('SELECT * FROM notes WHERE archived = 1 ORDER BY updated_at DESC');
}

export async function archiveNote(id: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE notes SET archived = 1, updated_at = ? WHERE id = ?',
    [now, id]
  );
}

export async function unarchiveNote(id: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE notes SET archived = 0, updated_at = ? WHERE id = ?',
    [now, id]
  );
}

export async function getNoteById(id: number): Promise<Note | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Note>('SELECT * FROM notes WHERE id = ?', [id]);
}

export async function createNote(title: string): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO notes (title, created_at, updated_at) VALUES (?, ?, ?)',
    [title, now, now]
  );
  return result.lastInsertRowId;
}

export async function updateNoteTitle(id: number, title: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE notes SET title = ?, updated_at = ? WHERE id = ?',
    [title, now, id]
  );
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDatabase();
  await deleteNoteImages(id);
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}

export async function setNoteCategory(noteId: number, categoryId: number | null): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE notes SET category_id = ?, updated_at = ? WHERE id = ?',
    [categoryId, now, noteId]
  );
}
