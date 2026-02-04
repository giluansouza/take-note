import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_SLASH_USED = "@ux.slash_used";
const KEY_SLASH_HINT_DISMISSED = "@ux.slash_hint_dismissed";
const KEY_BLOCKS_EDITED_COUNT = "@ux.blocks_edited_count";
const KEY_HINT_LIST_SHOWN = "@ux.hint_list_shown";
const KEY_HINT_CHECKLIST_SHOWN = "@ux.hint_checklist_shown";

const DISMISS_AFTER_BLOCK_EDITS = 3;

const editedBlockIdsThisSession = new Set<number>();
const markdownHintsShownThisSession = new Set<string>();

async function getBool(key: string): Promise<boolean> {
  const v = await AsyncStorage.getItem(key);
  return v === "1";
}

async function setBool(key: string, value: boolean): Promise<void> {
  await AsyncStorage.setItem(key, value ? "1" : "0");
}

async function getInt(key: string): Promise<number> {
  const v = await AsyncStorage.getItem(key);
  const n = v ? Number(v) : 0;
  return Number.isFinite(n) ? n : 0;
}

async function setInt(key: string, value: number): Promise<void> {
  await AsyncStorage.setItem(key, String(value));
}

export async function getSlashHintEligibility(): Promise<{
  show: boolean;
  blocksEditedCount: number;
}> {
  const [slashUsed, dismissed, blocksEditedCount] = await Promise.all([
    getBool(KEY_SLASH_USED),
    getBool(KEY_SLASH_HINT_DISMISSED),
    getInt(KEY_BLOCKS_EDITED_COUNT),
  ]);

  if (slashUsed || dismissed) {
    return { show: false, blocksEditedCount };
  }

  if (blocksEditedCount >= DISMISS_AFTER_BLOCK_EDITS) {
    // Keep state consistent if user reached the threshold.
    await setBool(KEY_SLASH_HINT_DISMISSED, true);
    return { show: false, blocksEditedCount };
  }

  return { show: true, blocksEditedCount };
}

export async function markSlashUsed(): Promise<void> {
  // Using slash implies the user learned it; dismiss the hint permanently.
  await Promise.all([
    setBool(KEY_SLASH_USED, true),
    setBool(KEY_SLASH_HINT_DISMISSED, true),
  ]);
}

export async function recordBlockEdited(blockId: number): Promise<{
  blocksEditedCount: number;
  dismissedNow: boolean;
}> {
  if (editedBlockIdsThisSession.has(blockId)) {
    // Avoid repeated AsyncStorage reads on every keystroke.
    return { blocksEditedCount: -1, dismissedNow: false };
  }
  editedBlockIdsThisSession.add(blockId);

  const prev = await getInt(KEY_BLOCKS_EDITED_COUNT);
  const next = prev + 1;
  await setInt(KEY_BLOCKS_EDITED_COUNT, next);

  if (next >= DISMISS_AFTER_BLOCK_EDITS) {
    await setBool(KEY_SLASH_HINT_DISMISSED, true);
    return { blocksEditedCount: next, dismissedNow: true };
  }

  return { blocksEditedCount: next, dismissedNow: false };
}

export type MarkdownShortcutHintType = "list" | "checklist";

function keyForMarkdownHint(type: MarkdownShortcutHintType): string {
  return type === "list" ? KEY_HINT_LIST_SHOWN : KEY_HINT_CHECKLIST_SHOWN;
}

export async function shouldShowMarkdownShortcutHint(
  type: MarkdownShortcutHintType,
): Promise<boolean> {
  if (markdownHintsShownThisSession.has(type)) return false;
  const shown = await getBool(keyForMarkdownHint(type));
  if (shown) {
    markdownHintsShownThisSession.add(type);
    return false;
  }
  return true;
}

export async function markMarkdownShortcutHintShown(
  type: MarkdownShortcutHintType,
): Promise<void> {
  markdownHintsShownThisSession.add(type);
  await setBool(keyForMarkdownHint(type), true);
}
