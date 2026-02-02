import { getDatabase } from './db';

export type BlockType = 'text' | 'checklist' | 'list';

export interface Block {
  id: number;
  section_id: number;
  type: BlockType;
  content: string | null;
  position: number;
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

export async function getBlocksBySectionId(sectionId: number): Promise<Block[]> {
  const db = await getDatabase();
  return db.getAllAsync<Block>(
    'SELECT * FROM blocks WHERE section_id = ? ORDER BY position ASC',
    [sectionId]
  );
}

export async function createBlock(
  sectionId: number,
  type: BlockType,
  position: number,
  content: string | null = null
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO blocks (section_id, type, content, position) VALUES (?, ?, ?, ?)',
    [sectionId, type, content, position]
  );
  return result.lastInsertRowId;
}

export async function updateBlockContent(id: number, content: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE blocks SET content = ? WHERE id = ?', [content, id]);
}

export async function deleteBlock(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM blocks WHERE id = ?', [id]);
}

export function parseChecklistContent(content: string | null): ChecklistItem[] {
  if (!content) return [];
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export function parseListContent(content: string | null): ListItem[] {
  if (!content) return [];
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}
