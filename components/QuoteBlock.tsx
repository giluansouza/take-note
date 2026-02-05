import { useEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Block, updateBlockContent, BlockType } from '@/lib/blocks.repository';
import { useTheme } from '@/lib/theme';
import { BlockTypeMenu } from './BlockTypeMenu';

interface QuoteBlockProps {
  block: Block;
  onUpdate: () => void;
  autoFocus?: boolean;
  isFocused?: boolean;
  onTransform: (blockId: number, newType: BlockType, newContent: string | null) => void;
  onFocusBlock?: () => void;
  onInsertBlockBelow?: (type?: BlockType) => void;
  onDelete?: () => void;
}

export function QuoteBlock({
  block,
  onUpdate,
  autoFocus,
  isFocused = false,
  onTransform,
  onFocusBlock,
  onInsertBlockBelow,
  onDelete,
}: QuoteBlockProps) {
  const { colors } = useTheme();
  const [content, setContent] = useState(block.content || '');
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
    onFocusBlock?.();
  };

  return (
    <View style={styles.container}>
      {isFocused && (
        <BlockTypeMenu
          currentType="quote"
          onSelectType={handleTypeChange}
          onInsertBelow={onInsertBlockBelow}
          onDelete={onDelete}
        />
      )}
      <View style={[styles.quoteBorder, { backgroundColor: colors.quoteBorder }]} />
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: colors.quoteText }]}
        value={content}
        onChangeText={handleContentChange}
        onSubmitEditing={handleSubmitEditing}
        placeholder="Quote"
        placeholderTextColor={colors.placeholder}
        onFocus={handleFocus}
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
    marginBottom: 6,
  },
  quoteBorder: {
    width: 3,
    marginRight: 8,
    alignSelf: 'stretch',
    borderRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontStyle: 'italic',
    padding: 8,
    borderRadius: 4,
    minHeight: 40,
    textAlignVertical: 'top',
  },
});
