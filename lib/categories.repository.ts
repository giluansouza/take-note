import { getDatabase } from './db';

export interface Category {
  id: number;
  title: string;
  color: string | null;
  position: number;
  created_at: string;
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY position ASC');
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', [id]);
}

export async function createCategory(title: string, color: string | null = null): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Get max position
  const result = await db.getFirstAsync<{ maxPos: number | null }>(
    'SELECT MAX(position) as maxPos FROM categories'
  );
  const position = (result?.maxPos ?? -1) + 1;

  const insertResult = await db.runAsync(
    'INSERT INTO categories (title, color, position, created_at) VALUES (?, ?, ?, ?)',
    [title, color, position, now]
  );
  return insertResult.lastInsertRowId;
}

export async function updateCategory(id: number, title: string, color: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE categories SET title = ?, color = ? WHERE id = ?',
    [title, color, id]
  );
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDatabase();
  // Remove category from notes first
  await db.runAsync('UPDATE notes SET category_id = NULL WHERE category_id = ?', [id]);
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function updateCategoryPositions(
  updates: { id: number; position: number }[]
): Promise<void> {
  const db = await getDatabase();
  for (const update of updates) {
    await db.runAsync(
      'UPDATE categories SET position = ? WHERE id = ?',
      [update.position, update.id]
    );
  }
}

export async function getCategoryNoteCount(categoryId: number): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM notes WHERE category_id = ? AND archived = 0',
    [categoryId]
  );
  return result?.count ?? 0;
}
