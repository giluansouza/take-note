import { useState, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import {
  Section as SectionType,
  updateSectionTitle,
  updateSectionSubtitle,
  deleteSection,
} from '@/lib/sections.repository';
import {
  getBlocksBySectionId,
  createBlock,
  Block,
  BlockType,
} from '@/lib/blocks.repository';
import { BlockRenderer } from './BlockRenderer';
import { useFocusEffect } from 'expo-router';

interface SectionProps {
  section: SectionType;
  onUpdate: () => void;
}

export function Section({ section, onUpdate }: SectionProps) {
  const [title, setTitle] = useState(section.title || '');
  const [subtitle, setSubtitle] = useState(section.subtitle || '');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subtitleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadBlocks();
      return () => {
        if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
        if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
      };
    }, [section.id])
  );

  const loadBlocks = async () => {
    try {
      const sectionBlocks = await getBlocksBySectionId(section.id);
      setBlocks(sectionBlocks);
    } catch (error) {
      console.error('Failed to load blocks:', error);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(() => {
      updateSectionTitle(section.id, newTitle || null).catch(console.error);
    }, 500);
  };

  const handleSubtitleChange = (newSubtitle: string) => {
    setSubtitle(newSubtitle);
    if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
    subtitleTimeoutRef.current = setTimeout(() => {
      updateSectionSubtitle(section.id, newSubtitle || null).catch(console.error);
    }, 500);
  };

  const handleAddBlock = async (type: BlockType) => {
    try {
      const position = blocks.length;
      const initialContent = type === 'text' ? '' : '[]';
      await createBlock(section.id, type, position, initialContent);
      await loadBlocks();
      setShowBlockMenu(false);
    } catch (error) {
      console.error('Failed to add block:', error);
    }
  };

  const handleDeleteSection = async () => {
    try {
      await deleteSection(section.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const handleBlockUpdate = () => {
    loadBlocks();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Section title"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.subtitleInput}
            value={subtitle}
            onChangeText={handleSubtitleChange}
            placeholder="Subtitle (optional)"
            placeholderTextColor="#bbb"
          />
        </View>
        <TouchableOpacity onPress={handleDeleteSection} style={styles.deleteButton}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.blocksContainer}>
        {blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} onUpdate={handleBlockUpdate} />
        ))}
      </View>

      {showBlockMenu ? (
        <View style={styles.blockMenu}>
          <TouchableOpacity
            style={styles.blockMenuItem}
            onPress={() => handleAddBlock('text')}
          >
            <Text style={styles.blockMenuText}>Text</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.blockMenuItem}
            onPress={() => handleAddBlock('checklist')}
          >
            <Text style={styles.blockMenuText}>Checklist</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.blockMenuItem}
            onPress={() => handleAddBlock('list')}
          >
            <Text style={styles.blockMenuText}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.blockMenuCancel}
            onPress={() => setShowBlockMenu(false)}
          >
            <Text style={styles.blockMenuCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addBlockButton}
          onPress={() => setShowBlockMenu(true)}
        >
          <Text style={styles.addBlockText}>+ Add Block</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    padding: 0,
    marginBottom: 4,
  },
  subtitleInput: {
    fontSize: 14,
    color: '#666',
    padding: 0,
    marginBottom: 12,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 24,
    color: '#999',
    lineHeight: 24,
  },
  blocksContainer: {
    marginTop: 8,
  },
  addBlockButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    marginTop: 12,
  },
  addBlockText: {
    fontSize: 14,
    color: '#666',
  },
  blockMenu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  blockMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  blockMenuText: {
    fontSize: 14,
    color: '#000',
  },
  blockMenuCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  blockMenuCancelText: {
    fontSize: 14,
    color: '#999',
  },
});
