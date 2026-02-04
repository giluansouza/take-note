import { getDatabase } from './db';

export type BlockType = 'text' | 'checklist' | 'list' | 'title' | 'subtitle' | 'quote' | 'image';

export interface Block {
  id: number;
  note_id: number;
  type: BlockType;
  content: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
}

export interface ListItem {
  id: number;
  text: string;
}

export interface ImageBlockContent {
  id: string;
  original_uri: string;
  thumbnail_uri: string;
  width: number;
  height: number;
  size_kb: number;
  mime_type: string;
  created_at: string;
}

export async function getBlocksByNoteId(noteId: number): Promise<Block[]> {
  const db = await getDatabase();
  return db.getAllAsync<Block>(
    'SELECT * FROM blocks WHERE note_id = ? ORDER BY "order" ASC',
    [noteId]
  );
}

export async function createBlock(
  noteId: number,
  type: BlockType,
  order: number,
  content: string | null = null
): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO blocks (note_id, type, content, "order", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [noteId, type, content, order, now, now]
  );
  return result.lastInsertRowId;
}

export async function updateBlockContent(id: number, content: string | null): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE blocks SET content = ?, updated_at = ? WHERE id = ?', [content, now, id]);
}

export async function transformBlockType(
  id: number,
  newType: BlockType,
  newContent: string | null
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE blocks SET type = ?, content = ?, updated_at = ? WHERE id = ?',
    [newType, newContent, now, id]
  );
}

export async function deleteBlock(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM blocks WHERE id = ?', [id]);
}

export function parseChecklistContent(content: string | null): ChecklistItem[] {
  if (!content) return [{ id: 1, text: '', done: false }];
  try {
    const items = JSON.parse(content);
    return Array.isArray(items) && items.length > 0 ? items : [{ id: 1, text: '', done: false }];
  } catch {
    return [{ id: 1, text: '', done: false }];
  }
}

export function parseListContent(content: string | null): ListItem[] {
  if (!content) return [{ id: 1, text: '' }];
  try {
    const items = JSON.parse(content);
    return Array.isArray(items) && items.length > 0 ? items : [{ id: 1, text: '' }];
  } catch {
    return [{ id: 1, text: '' }];
  }
}

/**
 * Convert plain text content to checklist JSON format.
 * Each line becomes a checklist item.
 */
export function textToChecklistContent(text: string | null): string {
  if (!text || !text.trim()) {
    return JSON.stringify([{ id: 1, text: '', done: false }]);
  }
  const lines = text.split('\n').filter((line) => line.trim());
  const items: ChecklistItem[] = lines.map((line, index) => ({
    id: index + 1,
    text: line.trim(),
    done: false,
  }));
  return items.length > 0
    ? JSON.stringify(items)
    : JSON.stringify([{ id: 1, text: '', done: false }]);
}

/**
 * Convert plain text content to list JSON format.
 * Each line becomes a list item.
 */
export function textToListContent(text: string | null): string {
  if (!text || !text.trim()) {
    return JSON.stringify([{ id: 1, text: '' }]);
  }
  const lines = text.split('\n').filter((line) => line.trim());
  const items: ListItem[] = lines.map((line, index) => ({
    id: index + 1,
    text: line.trim(),
  }));
  return items.length > 0
    ? JSON.stringify(items)
    : JSON.stringify([{ id: 1, text: '' }]);
}

export function parseImageContent(content: string | null): ImageBlockContent | null {
  if (!content) return null;
  try {
    return JSON.parse(content) as ImageBlockContent;
  } catch {
    return null;
  }
}
