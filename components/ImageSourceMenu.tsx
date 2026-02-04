import {
  View,
  TouchableOpacity,
  Text,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ImageSourceMenuProps {
  visible: boolean;
  onSelectSource: (source: 'camera' | 'gallery') => void;
  onClose: () => void;
}

export function ImageSourceMenu({ visible, onSelectSource, onClose }: ImageSourceMenuProps) {
  const { t } = useTranslation();

  const handleSelect = (source: 'camera' | 'gallery') => {
    onSelectSource(source);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menu}>
          <Text style={styles.menuTitle}>{t('blocks.addImage')}</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleSelect('camera')}
          >
            <Ionicons name="camera-outline" size={20} color="#333" />
            <Text style={styles.menuItemText}>{t('blocks.fromCamera')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleSelect('gallery')}
          >
            <Ionicons name="images-outline" size={20} color="#333" />
            <Text style={styles.menuItemText}>{t('blocks.fromGallery')}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuTitle: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
});
