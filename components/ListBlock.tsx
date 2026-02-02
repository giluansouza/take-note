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
import {
  Block,
  updateBlockContent,
  deleteBlock,
  parseListContent,
  ListItem,
} from '@/lib/blocks.repository';

interface ListBlockProps {
  block: Block;
  onUpdate: () => void;
}

export function ListBlock({ block, onUpdate }: ListBlockProps) {
  const [items, setItems] = useState<ListItem[]>(() =>
    parseListContent(block.content)
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRefs = useRef<Map<number, TextInput>>(new Map());

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
            <Text style={styles.bullet}>•</Text>
            <TextInput
              ref={(ref) => {
                if (ref) inputRefs.current.set(item.id, ref);
              }}
              style={styles.itemText}
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
  bullet: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    width: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    padding: 4,
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
