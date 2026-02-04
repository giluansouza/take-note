import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { ImageBlockContent } from './blocks.repository';

const IMAGES_DIR = `${FileSystem.documentDirectory}images/`;
const COMPRESSION_QUALITY = 0.8;
const THUMBNAIL_QUALITY = 0.6;
const MAX_WIDTH_LANDSCAPE = 2048;
const MAX_WIDTH_PORTRAIT = 1536;
const THUMBNAIL_WIDTH = 400;

export interface ProcessedImage {
  content: ImageBlockContent;
}

export async function ensureNoteImagesDir(noteId: number): Promise<string> {
  const noteDir = `${IMAGES_DIR}${noteId}/`;
  const dirInfo = await FileSystem.getInfoAsync(noteDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(noteDir, { intermediates: true });
  }
  return noteDir;
}

export async function processAndSaveImage(
  sourceUri: string,
  noteId: number,
  originalWidth: number,
  originalHeight: number
): Promise<ProcessedImage> {
  const imageId = Crypto.randomUUID();
  const noteDir = await ensureNoteImagesDir(noteId);

  const isLandscape = originalWidth > originalHeight;
  const maxWidth = isLandscape ? MAX_WIDTH_LANDSCAPE : MAX_WIDTH_PORTRAIT;

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (originalWidth > maxWidth) {
    const ratio = maxWidth / originalWidth;
    targetWidth = maxWidth;
    targetHeight = Math.round(originalHeight * ratio);
  }

  const originalResult = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: targetWidth, height: targetHeight } }],
    { compress: COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );

  const thumbnailRatio = THUMBNAIL_WIDTH / targetWidth;
  const thumbnailHeight = Math.round(targetHeight * thumbnailRatio);

  const thumbnailResult = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: THUMBNAIL_WIDTH, height: thumbnailHeight } }],
    { compress: THUMBNAIL_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );

  const originalPath = `${noteDir}${imageId}.jpg`;
  const thumbnailPath = `${noteDir}${imageId}_thumb.jpg`;

  await FileSystem.moveAsync({ from: originalResult.uri, to: originalPath });
  await FileSystem.moveAsync({ from: thumbnailResult.uri, to: thumbnailPath });

  const fileInfo = await FileSystem.getInfoAsync(originalPath);
  const sizeKb = fileInfo.exists && 'size' in fileInfo && fileInfo.size ? Math.round(fileInfo.size / 1024) : 0;

  const content: ImageBlockContent = {
    id: imageId,
    original_uri: originalPath,
    thumbnail_uri: thumbnailPath,
    width: targetWidth,
    height: targetHeight,
    size_kb: sizeKb,
    mime_type: 'image/jpeg',
    created_at: new Date().toISOString(),
  };

  return { content };
}

export async function deleteImageFiles(content: ImageBlockContent): Promise<void> {
  try {
    const originalInfo = await FileSystem.getInfoAsync(content.original_uri);
    if (originalInfo.exists) {
      await FileSystem.deleteAsync(content.original_uri, { idempotent: true });
    }

    const thumbInfo = await FileSystem.getInfoAsync(content.thumbnail_uri);
    if (thumbInfo.exists) {
      await FileSystem.deleteAsync(content.thumbnail_uri, { idempotent: true });
    }
  } catch (error) {
    console.error('Failed to delete image files:', error);
  }
}

export async function deleteNoteImages(noteId: number): Promise<void> {
  const noteDir = `${IMAGES_DIR}${noteId}/`;
  try {
    const dirInfo = await FileSystem.getInfoAsync(noteDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(noteDir, { idempotent: true });
    }
  } catch (error) {
    console.error('Failed to delete note images:', error);
  }
}
