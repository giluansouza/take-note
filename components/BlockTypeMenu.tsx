import { BlockType } from "@/lib/blocks.repository";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BlockTypeMenuProps {
  currentType: BlockType;
  onSelectType: (type: BlockType) => void;
  onInsertBelow?: (type?: BlockType) => void;
  onDelete?: () => void;
}

const BLOCK_TYPES: { type: BlockType; icon: string; labelKey: string }[] = [
  { type: "text", icon: "text-outline", labelKey: "blocks.text" },
  { type: "title", icon: "text", labelKey: "blocks.title" },
  { type: "subtitle", icon: "text-sharp", labelKey: "blocks.subtitle" },
  { type: "quote", icon: "chatbox-ellipses-outline", labelKey: "blocks.quote" },
  { type: "list", icon: "list-outline", labelKey: "blocks.list" },
  { type: "checklist", icon: "checkbox-outline", labelKey: "blocks.checklist" },
  { type: "image", icon: "image-outline", labelKey: "blocks.image" },
];

export function BlockTypeMenu({
  currentType,
  onSelectType,
  onInsertBelow,
  onDelete,
}: BlockTypeMenuProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const handleSelect = (type: BlockType) => {
    setVisible(false);
    if (type !== currentType) {
      onSelectType(type);
    }
  };

  const handleInsertBelow = (type?: BlockType) => {
    setVisible(false);
    onInsertBelow?.(type);
  };

  const handleDelete = () => {
    setVisible(false);
    onDelete?.();
  };

  const currentTypeInfo = BLOCK_TYPES.find((bt) => bt.type === currentType);
  const isImageBlock = currentType === "image";
  const transformableTypes = BLOCK_TYPES.filter((bt) => bt.type !== "image");

  const handleTypePress = (type: BlockType) => {
    if (type === "image") {
      // Image type triggers insert flow instead of transform
      handleInsertBelow("image");
    } else {
      handleSelect(type);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={(currentTypeInfo?.icon as any) || "text-outline"}
          size={14}
          color="#bbb"
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.menu} onPress={() => {}}>
            {!isImageBlock && (
              <>
                <Text style={styles.menuTitle}>{t("blocks.blockType")}</Text>
                {transformableTypes.map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.menuItem,
                      currentType === item.type && styles.menuItemActive,
                    ]}
                    onPress={() => handleTypePress(item.type)}
                  >
                    <View style={styles.menuItemIcon}>
                      <Ionicons
                        name={item.icon as any}
                        size={16}
                        color={currentType === item.type ? "#000" : "#666"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuItemLabel,
                        currentType === item.type && styles.menuItemTextActive,
                      ]}
                    >
                      {t(item.labelKey)}
                    </Text>
                    {currentType === item.type && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
                {onInsertBelow && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleTypePress("image")}
                  >
                    <View style={styles.menuItemIcon}>
                      <Ionicons name="image-outline" size={16} color="#666" />
                    </View>
                    <Text style={styles.menuItemLabel}>
                      {t("blocks.image")}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {onInsertBelow && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleInsertBelow()}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons name="add-outline" size={16} color="#666" />
                  </View>
                  <Text style={styles.menuItemLabel}>
                    {t("blocks.insertBelow")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {onDelete && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDelete}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons name="trash-outline" size={16} color="#d32f2f" />
                  </View>
                  <Text style={[styles.menuItemLabel, styles.deleteText]}>
                    {t("blocks.delete")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  triggerText: {
    fontSize: 12,
    color: "#bbb",
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuTitle: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemActive: {
    backgroundColor: "#f5f5f5",
  },
  menuItemIcon: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  menuItemTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  deleteText: {
    color: "#d32f2f",
  },
  checkmark: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
    marginHorizontal: 16,
  },
});
