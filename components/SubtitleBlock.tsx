import { useEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Block, updateBlockContent, BlockType } from '@/lib/blocks.repository';
import { BlockTypeMenu } from './BlockTypeMenu';

interface SubtitleBlockProps {
  block: Block;
  onUpdate: () => void;
  autoFocus?: boolean;
  onTransform: (blockId: number, newType: BlockType, newContent: string | null) => void;
  onFocusBlock?: () => void;
  onInsertBlockBelow?: () => void;
  onDelete?: () => void;
}

export function SubtitleBlock({
  block,
  onUpdate,
  autoFocus,
  onTransform,
  onFocusBlock,
  onInsertBlockBelow,
  onDelete,
}: SubtitleBlockProps) {
  const [content, setContent] = useState(block.content || '');
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [autoFocus]);

  const handleContentChange = (newContent: string) => {
    const cleanContent = newContent.replace(/\n/g, '');
    setContent(cleanContent);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateBlockContent(block.id, cleanContent).catch(console.error);
    }, 500);
  };

  const handleSubmitEditing = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updateBlockContent(block.id, content).catch(console.error);
    onInsertBlockBelow?.();
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
          currentType="subtitle"
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
        onSubmitEditing={handleSubmitEditing}
        placeholder="Subtitle"
        placeholderTextColor="#999"
        onFocus={handleFocus}
        onBlur={handleBlur}
        blurOnSubmit={false}
        returnKeyType="next"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 8,
    borderRadius: 4,
    minHeight: 40,
    textAlignVertical: 'top',
  },
});
