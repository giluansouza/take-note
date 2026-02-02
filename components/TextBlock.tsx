import { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Block, updateBlockContent, deleteBlock } from '@/lib/blocks.repository';

interface TextBlockProps {
  block: Block;
  onUpdate: () => void;
}

export function TextBlock({ block, onUpdate }: TextBlockProps) {
  const [content, setContent] = useState(block.content || '');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateBlockContent(block.id, newContent).catch(console.error);
    }, 500);
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
      <TextInput
        style={styles.input}
        value={content}
        onChangeText={handleContentChange}
        placeholder="Enter text..."
        placeholderTextColor="#999"
        multiline
      />
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
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    padding: 8,
    backgroundColor: '#fafafa',
    borderRadius: 4,
    minHeight: 40,
    textAlignVertical: 'top',
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
