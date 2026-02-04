import { Block, BlockType, updateBlockContent } from "@/lib/blocks.repository";
import { useEffect, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import { BlockTypeMenu } from "./BlockTypeMenu";

interface TextBlockProps {
  block: Block;
  onUpdate: () => void;
  autoFocus?: boolean;
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
  onTransform,
  onFocusBlock,
  onInsertBlockBelow,
  onDelete,
}: TextBlockProps) {
  const [content, setContent] = useState(block.content || "");
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const prevContentRef = useRef(block.content || "");
  const createBlockPendingRef = useRef(false);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [autoFocus]);

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

    // Markdown-like transformations - check if user just typed a trigger at the start
    for (const trigger in TRANSFORMATION_MAP) {
      if (newContent.startsWith(trigger)) {
        // Only transform if the trigger was just added (not already there)
        const prevHadTrigger = prevContentRef.current.startsWith(trigger);
        if (!prevHadTrigger) {
          const newType = TRANSFORMATION_MAP[trigger];
          const contentAfterTrigger = newContent.slice(trigger.length);
          onTransform(block.id, newType, contentAfterTrigger);
          return;
        }
      }
    }

    setContent(newContent);
    prevContentRef.current = newContent;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateBlockContent(block.id, newContent).catch(console.error);
    }, 500);
  };

  const handleTypeChange = (newType: BlockType) => {
    onTransform(block.id, newType, content);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusBlock?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      {isFocused && (
        <BlockTypeMenu
          currentType="text"
          onSelectType={handleTypeChange}
          onInsertBelow={onInsertBlockBelow}
          onDelete={onDelete}
        />
      )}
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={content}
        onChangeText={handleContentChange}
        onKeyPress={handleKeyPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder=""
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    padding: 8,
    borderRadius: 4,
    // minHeight: 40,
    textAlignVertical: "top",
  },
});
