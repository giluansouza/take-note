import { Block, BlockType, updateBlockContent } from "@/lib/blocks.repository";
import { useTheme } from "@/lib/theme";
import {
  getSlashHintEligibility,
  markSlashUsed,
  recordBlockEdited,
  type MarkdownShortcutHintType,
} from "@/lib/ux/hints";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputSelectionChangeEventData,
  TextInputKeyPressEventData,
  Text,
  View,
} from "react-native";
import { BlockTypeMenu, type BlockTypeMenuHandle } from "./BlockTypeMenu";

interface TextBlockProps {
  block: Block;
  onUpdate: () => void;
  autoFocus?: boolean;
  isFocused?: boolean;
  placeholder?: string;
  showSlashHint?: boolean;
  onDetectedMarkdownShortcut?: (type: MarkdownShortcutHintType) => void;
  onTransform: (
    blockId: number,
    newType: BlockType,
    newContent: string | null,
  ) => void;
  onFocusBlock?: () => void;
  onInsertBlockBelow?: (type?: BlockType) => void;
  onDelete?: () => void;
}

const TRANSFORMATION_MAP: { [key: string]: BlockType } = {
  "# ": "title",
  "## ": "subtitle",
  "> ": "quote",
  "- ": "list",
  "[] ": "checklist",
  "[ ] ": "checklist",
};

export function TextBlock({
  block,
  onUpdate,
  autoFocus,
  isFocused = false,
  placeholder,
  showSlashHint,
  onDetectedMarkdownShortcut,
  onTransform,
  onFocusBlock,
  onInsertBlockBelow,
  onDelete,
}: TextBlockProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [content, setContent] = useState(block.content || "");
  const [hasInputFocus, setHasInputFocus] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showHint, setShowHint] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const prevContentRef = useRef(block.content || "");
  const createBlockPendingRef = useRef(false);
  const selectionRef = useRef({ start: 0, end: 0 });
  const menuRef = useRef<BlockTypeMenuHandle | null>(null);
  const openMenuPendingRef = useRef(false);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!showSlashHint) {
      setShowHint(false);
      return;
    }
    let cancelled = false;
    getSlashHintEligibility()
      .then(({ show }) => {
        if (!cancelled) setShowHint(show);
      })
      .catch(() => {
        // If storage fails for some reason, don't block usage.
        if (!cancelled) setShowHint(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showSlashHint]);

  useEffect(() => {
    if (!isFocused) return;
    if (!openMenuPendingRef.current) return;
    if (!menuRef.current) return;
    openMenuPendingRef.current = false;
    menuRef.current.open();
  }, [isFocused]);

  const openMenu = () => {
    if (menuRef.current) {
      menuRef.current.open();
      return;
    }
    openMenuPendingRef.current = true;
    // If the menu is being mounted in the same render, retry on next tick.
    setTimeout(() => {
      if (!openMenuPendingRef.current) return;
      if (!menuRef.current) return;
      openMenuPendingRef.current = false;
      menuRef.current.open();
    }, 0);
  };

  const findSingleCharInsertion = (prev: string, next: string) => {
    if (next.length !== prev.length + 1) return null;

    let i = 0;
    while (i < prev.length && prev[i] === next[i]) i++;

    const insertedIndex = i;
    const insertedChar = next[insertedIndex];

    // Ensure the rest matches with a +1 offset.
    for (let j = insertedIndex; j < prev.length; j++) {
      if (prev[j] !== next[j + 1]) return null;
    }

    return { insertedIndex, insertedChar };
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (e.nativeEvent.key !== "Enter") return;

    // Check if cursor is at an empty line (content ends with newline or is empty)
    const endsWithEmptyLine = content.endsWith("\n") || content === "";
    if (endsWithEmptyLine && onInsertBlockBelow) {
      createBlockPendingRef.current = true;
      return;
    }

    // No title promotion: keep content as-is
  };

  const handleContentChange = (newContent: string) => {
    const prevContent = prevContentRef.current;

    // Create new block below when Enter pressed on empty line
    if (createBlockPendingRef.current) {
      createBlockPendingRef.current = false;
      // Remove the trailing newlines that triggered this
      const trimmedContent = content.replace(/\n+$/, "");
      setContent(trimmedContent);
      prevContentRef.current = trimmedContent;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      updateBlockContent(block.id, trimmedContent).catch(console.error);
      onInsertBlockBelow?.();
      return;
    }

    // Slash command (MVP): typing "/" at the start of a line opens the block menu.
    const insertion = findSingleCharInsertion(prevContent, newContent);
    if (insertion?.insertedChar === "/") {
      const { insertedIndex } = insertion;
      const isStartOfLine =
        insertedIndex === 0 || newContent[insertedIndex - 1] === "\n";

      if (isStartOfLine) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Remove the "/" so we don't leave junk in the text.
        setContent(prevContent);
        prevContentRef.current = prevContent;

        // Keep cursor where it was before inserting "/".
        const caret = insertedIndex;
        selectionRef.current = { start: caret, end: caret };
        setSelection(selectionRef.current);

        if (showHint) {
          markSlashUsed().catch(console.error);
          setShowHint(false);
        }

        openMenu();
        return;
      }
    }

    // Markdown-like transformations - check if user just typed a trigger at the start
    for (const trigger in TRANSFORMATION_MAP) {
      if (newContent.startsWith(trigger)) {
        // Only transform if the trigger was just added (not already there)
        const prevHadTrigger = prevContentRef.current.startsWith(trigger);
        if (!prevHadTrigger) {
          const newType = TRANSFORMATION_MAP[trigger];
          const contentAfterTrigger = newContent.slice(trigger.length);
          if (newType === "list") {
            onDetectedMarkdownShortcut?.("list");
          } else if (newType === "checklist") {
            onDetectedMarkdownShortcut?.("checklist");
          }
          onTransform(block.id, newType, contentAfterTrigger);
          return;
        }
      }
    }

    setContent(newContent);
    prevContentRef.current = newContent;

    if (showHint && newContent !== prevContent) {
      recordBlockEdited(block.id)
        .then(({ dismissedNow }) => {
          if (dismissedNow) setShowHint(false);
        })
        .catch(console.error);
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateBlockContent(block.id, newContent).catch(console.error);
    }, 500);
  };

  const handleTypeChange = (newType: BlockType) => {
    onTransform(block.id, newType, content);
  };

  const handleFocus = () => {
    setHasInputFocus(true);
    onFocusBlock?.();
  };

  const handleBlur = () => {
    setHasInputFocus(false);
  };

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    selectionRef.current = e.nativeEvent.selection;
    setSelection(selectionRef.current);
  };

  return (
    <View style={styles.container}>
      {isFocused && (
        <BlockTypeMenu
          ref={menuRef}
          currentType="text"
          onSelectType={handleTypeChange}
          onInsertBelow={onInsertBlockBelow}
          onDelete={onDelete}
        />
      )}
      <View style={styles.inputWrap}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.text }]}
          value={content}
          onChangeText={handleContentChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSelectionChange={handleSelectionChange}
          selection={selection}
          placeholder={placeholder ?? ""}
          placeholderTextColor={colors.placeholder}
          multiline
        />
        {showHint && hasInputFocus && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            {t("hints.slashTip")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  inputWrap: {
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 8,
    borderRadius: 4,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 8,
  },
});
