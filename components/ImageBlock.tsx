import { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Block, BlockType, parseImageContent, ImageBlockContent } from '@/lib/blocks.repository';
import { useTheme } from '@/lib/theme';
import { BlockTypeMenu } from './BlockTypeMenu';

interface ImageBlockProps {
  block: Block;
  onUpdate: () => void;
  autoFocus?: boolean;
  isFocused?: boolean;
  onTransform: (blockId: number, newType: BlockType, newContent: string | null) => void;
  onFocusBlock?: () => void;
  onInsertBlockBelow?: (type?: BlockType) => void;
  onDelete?: () => void;
  onImagePress?: (content: ImageBlockContent) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_IMAGE_HEIGHT = 300;

export function ImageBlock({
  block,
  isFocused = false,
  onFocusBlock,
  onInsertBlockBelow,
  onDelete,
  onImagePress,
}: ImageBlockProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  const imageContent = parseImageContent(block.content);

  if (!imageContent) {
    return null;
  }

  const aspectRatio = imageContent.width / imageContent.height;
  const displayWidth = SCREEN_WIDTH - 56;
  let displayHeight = displayWidth / aspectRatio;

  if (displayHeight > MAX_IMAGE_HEIGHT) {
    displayHeight = MAX_IMAGE_HEIGHT;
  }

  const handlePress = () => {
    onFocusBlock?.();
  };

  const handleViewFullscreen = () => {
    onImagePress?.(imageContent);
  };

  const handleTypeChange = (_newType: BlockType) => {
    // Image blocks cannot transform to other types
  };

  return (
    <View style={styles.container}>
      {isFocused && (
        <BlockTypeMenu
          currentType="image"
          onSelectType={handleTypeChange}
          onInsertBelow={onInsertBlockBelow}
          onDelete={onDelete}
        />
      )}
      <TouchableOpacity
        style={[styles.imageContainer, { backgroundColor: colors.backgroundSecondary }]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {isLoading && (
          <View style={[styles.placeholder, { height: displayHeight, backgroundColor: colors.backgroundSecondary }]}>
            <ActivityIndicator color={colors.placeholder} />
          </View>
        )}
        <Image
          source={{ uri: imageContent.thumbnail_uri }}
          style={[
            styles.image,
            { height: displayHeight },
            isLoading && styles.hidden,
          ]}
          contentFit="cover"
          onLoadEnd={() => setIsLoading(false)}
          transition={200}
        />
        {isFocused && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={handleViewFullscreen}
          >
            <Ionicons name="expand-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
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
  imageContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    borderRadius: 8,
  },
  hidden: {
    opacity: 0,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  expandButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
});
