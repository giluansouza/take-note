import { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import {
  Block,
  BlockType,
  updateBlockContent,
  parseListContent,
  ListItem,
} from '@/lib/blocks.repository';
import { useTheme } from '@/lib/theme';
import { BlockTypeMenu } from './BlockTypeMenu';

interface ListBlockProps {
  block: Block;
  onUpdate: () => void;
  autoFocus?: boolean;
  isFocused?: boolean;
  onFocusBlock?: () => void;
  onTransform?: (blockId: number, newType: BlockType, newContent: string | null) => void;
  onInsertBlockBelow?: (type?: BlockType) => void;
  onDelete?: () => void;
}

export function ListBlock({
  block,
  onUpdate,
  autoFocus,
  isFocused = false,
  onFocusBlock,
  onTransform,
  onInsertBlockBelow,
  onDelete,
}: ListBlockProps) {
  const { colors } = useTheme();
  const [items, setItems] = useState<ListItem[]>(() =>
    parseListContent(block.content)
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRefs = useRef<Map<number, TextInput>>(new Map());
  const autoFocusUsedRef = useRef(false);
  const focusCountRef = useRef(0);

  useEffect(() => {
    if (!autoFocus) return;
    if (autoFocusUsedRef.current) return;
    const first = items[0];
    if (!first) return;
    autoFocusUsedRef.current = true;
    setTimeout(() => {
      inputRefs.current.get(first.id)?.focus();
    }, 50);
  }, [autoFocus, items]);

  const saveItems = (newItems: ListItem[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateBlockContent(block.id, JSON.stringify(newItems)).catch(console.error);
    }, 300);
  };

  const handleTextChange = (id: number, text: string) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, text } : item
    );
    setItems(newItems);
    saveItems(newItems);
  };

  const handleAddItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
    const newItems = [...items, { id: newId, text: '' }];
    setItems(newItems);
    saveItems(newItems);
    setTimeout(() => {
      inputRefs.current.get(newId)?.focus();
    }, 50);
  };

  const handleKeyPress = (
    id: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      const item = items.find((i) => i.id === id);
      if (item && item.text === '') {
        const newItems = items.filter((i) => i.id !== id);
        setItems(newItems);
        saveItems(newItems);
      }
    }
  };

  const handleSubmitEditing = (index: number) => {
    const currentItem = items[index];

    if (currentItem && currentItem.text === '') {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      saveItems(newItems);
      onInsertBlockBelow?.();
      return;
    }

    if (index === items.length - 1) {
      handleAddItem();
    } else {
      const nextItem = items[index + 1];
      if (nextItem) {
        inputRefs.current.get(nextItem.id)?.focus();
      }
    }
  };

  const handleTypeChange = (newType: BlockType) => {
    if (!onTransform) return;
    const textContent = items.map((item) => item.text).filter(Boolean).join('\n');
    onTransform(block.id, newType, textContent);
  };

  const handleFocus = () => {
    focusCountRef.current += 1;
    onFocusBlock?.();
  };

  const handleBlur = () => {
    focusCountRef.current -= 1;
    setTimeout(() => {
      if (focusCountRef.current <= 0) {
        focusCountRef.current = 0;
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      {isFocused && (
        <BlockTypeMenu
          currentType="list"
          onSelectType={handleTypeChange}
          onInsertBelow={onInsertBlockBelow}
          onDelete={onDelete}
        />
      )}
      <View style={[styles.content, { backgroundColor: colors.backgroundTertiary }]}>
        {items.map((item, index) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={[styles.bullet, { color: colors.textTertiary }]}>•</Text>
            <TextInput
              ref={(ref) => {
                if (ref) inputRefs.current.set(item.id, ref);
              }}
              style={[styles.itemText, { color: colors.text }]}
              value={item.text}
              onChangeText={(text) => handleTextChange(item.id, text)}
              onKeyPress={(e) => handleKeyPress(item.id, e)}
              onSubmitEditing={() => handleSubmitEditing(index)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Item"
              placeholderTextColor={colors.placeholder}
              blurOnSubmit={false}
            />
          </View>
        ))}
        <TouchableOpacity style={styles.addItem} onPress={handleAddItem}>
          <Text style={[styles.addItemText, { color: colors.textTertiary }]}>+ Add item</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  content: {
    flex: 1,
    borderRadius: 4,
    padding: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    width: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    padding: 4,
  },
  addItem: {
    paddingVertical: 8,
  },
  addItemText: {
    fontSize: 14,
  },
});
