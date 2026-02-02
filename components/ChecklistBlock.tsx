import { useState, useRef } from 'react';
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
  updateBlockContent,
  deleteBlock,
  parseChecklistContent,
  ChecklistItem,
} from '@/lib/blocks.repository';

interface ChecklistBlockProps {
  block: Block;
  onUpdate: () => void;
}

export function ChecklistBlock({ block, onUpdate }: ChecklistBlockProps) {
  const [items, setItems] = useState<ChecklistItem[]>(() =>
    parseChecklistContent(block.content)
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRefs = useRef<Map<number, TextInput>>(new Map());

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
    if (index === items.length - 1) {
      handleAddItem();
    } else {
      const nextItem = items[index + 1];
      if (nextItem) {
        inputRefs.current.get(nextItem.id)?.focus();
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBlock(block.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  return (
    <View style={styles.container}>
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
      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteText: {
    fontSize: 18,
    color: '#ccc',
  },
});
