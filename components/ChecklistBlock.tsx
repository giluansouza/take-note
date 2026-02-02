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
import * as Haptics from 'expo-haptics';
import {
  Block,
  BlockType,
  updateBlockContent,
  parseChecklistContent,
  ChecklistItem,
} from '@/lib/blocks.repository';
import { BlockTypeMenu } from './BlockTypeMenu';

interface ChecklistBlockProps {
  block: Block;
  onUpdate: () => void;
  autoFocus?: boolean;
  onFocusBlock?: () => void;
  onTransform?: (blockId: number, newType: BlockType, newContent: string | null) => void;
  onInsertBlockBelow?: () => void;
  onDelete?: () => void;
}

export function ChecklistBlock({
  block,
  onUpdate,
  autoFocus,
  onFocusBlock,
  onTransform,
  onInsertBlockBelow,
  onDelete,
}: ChecklistBlockProps) {
  const [items, setItems] = useState<ChecklistItem[]>(() =>
    parseChecklistContent(block.content)
  );
  const [isFocused, setIsFocused] = useState(false);
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

  const saveItems = (newItems: ChecklistItem[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateBlockContent(block.id, JSON.stringify(newItems)).catch(console.error);
    }, 300);
  };

  const handleToggle = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newItems = items.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setItems(newItems);
    saveItems(newItems);
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
    const newItems = [...items, { id: newId, text: '', done: false }];
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
    setIsFocused(true);
    onFocusBlock?.();
  };

  const handleBlur = () => {
    focusCountRef.current -= 1;
    setTimeout(() => {
      if (focusCountRef.current <= 0) {
        setIsFocused(false);
        focusCountRef.current = 0;
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      {isFocused && (
        <BlockTypeMenu
          currentType="checklist"
          onSelectType={handleTypeChange}
          onInsertBelow={onInsertBlockBelow}
          onDelete={onDelete}
        />
      )}
      <View style={styles.content}>
        {items.map((item, index) => (
          <View key={item.id} style={styles.itemRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => handleToggle(item.id)}
            >
              <View style={[styles.checkboxInner, item.done && styles.checkboxChecked]}>
                {item.done && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <TextInput
              ref={(ref) => {
                if (ref) inputRefs.current.set(item.id, ref);
              }}
              style={[styles.itemText, item.done && styles.itemTextDone]}
              value={item.text}
              onChangeText={(text) => handleTextChange(item.id, text)}
              onKeyPress={(e) => handleKeyPress(item.id, e)}
              onSubmitEditing={() => handleSubmitEditing(index)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Item"
              placeholderTextColor="#999"
              blurOnSubmit={false}
            />
          </View>
        ))}
        <TouchableOpacity style={styles.addItem} onPress={handleAddItem}>
          <Text style={styles.addItemText}>+ Add item</Text>
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
    backgroundColor: '#fafafa',
    borderRadius: 4,
    padding: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    padding: 4,
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  addItem: {
    paddingVertical: 8,
  },
  addItemText: {
    fontSize: 14,
    color: '#666',
  },
});
