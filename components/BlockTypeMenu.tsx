import { BlockType } from "@/lib/blocks.repository";
import { useTheme } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useImperativeHandle, useState } from "react";
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

export type BlockTypeMenuHandle = {
  open: () => void;
  close: () => void;
};

const BLOCK_TYPES: {
  type: BlockType;
  icon: string;
  labelKey: string;
  shortcut?: string;
}[] = [
  { type: "text", icon: "text-outline", labelKey: "blocks.text" },
  { type: "title", icon: "text", labelKey: "blocks.title", shortcut: "# " },
  {
    type: "subtitle",
    icon: "text-sharp",
    labelKey: "blocks.subtitle",
    shortcut: "## ",
  },
  {
    type: "quote",
    icon: "chatbox-ellipses-outline",
    labelKey: "blocks.quote",
    shortcut: "> ",
  },
  { type: "list", icon: "list-outline", labelKey: "blocks.list", shortcut: "- " },
  {
    type: "checklist",
    icon: "checkbox-outline",
    labelKey: "blocks.checklist",
    shortcut: "[] ",
  },
  { type: "image", icon: "image-outline", labelKey: "blocks.image" },
];

export const BlockTypeMenu = forwardRef<BlockTypeMenuHandle, BlockTypeMenuProps>(
  function BlockTypeMenu(
    { currentType, onSelectType, onInsertBelow, onDelete }: BlockTypeMenuProps,
    ref,
  ) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      open: () => setVisible(true),
      close: () => setVisible(false),
    }),
    [],
  );

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
          color={colors.placeholder}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}
          onPress={() => setVisible(false)}
        >
          <Pressable
            style={[styles.menu, { backgroundColor: colors.modalBackground }]}
            onPress={() => {}}
          >
            {!isImageBlock && (
              <>
                <Text style={[styles.menuTitle, { color: colors.placeholder }]}>
                  {t("blocks.blockType")}
                </Text>
                {transformableTypes.map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.menuItem,
                      currentType === item.type && {
                        backgroundColor: colors.backgroundSecondary,
                      },
                    ]}
                    onPress={() => handleTypePress(item.type)}
                  >
                    <View style={styles.menuItemIcon}>
                      <Ionicons
                        name={item.icon as any}
                        size={16}
                        color={
                          currentType === item.type
                            ? colors.text
                            : colors.textTertiary
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuItemLabel,
                        { color: colors.textSecondary },
                        currentType === item.type && {
                          color: colors.text,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {t(item.labelKey)}
                    </Text>
                    <View style={styles.menuItemRight}>
                      {!!item.shortcut && (
                        <Text
                          style={[styles.shortcut, { color: colors.textTertiary }]}
                        >
                          {item.shortcut}
                        </Text>
                      )}
                      {currentType === item.type && (
                        <Text
                          style={[styles.checkmark, { color: colors.primary }]}
                        >
                          ✓
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                {onInsertBelow && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleTypePress("image")}
                  >
                    <View style={styles.menuItemIcon}>
                      <Ionicons
                        name="image-outline"
                        size={16}
                        color={colors.textTertiary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuItemLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("blocks.image")}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* {onInsertBelow && (
              <>
                <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleInsertBelow()}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons name="add-outline" size={16} color={colors.textTertiary} />
                  </View>
                  <Text style={[styles.menuItemLabel, { color: colors.textSecondary }]}>
                    {t("blocks.insertBelow")}
                  </Text>
                </TouchableOpacity>
              </>
            )} */}

            {onDelete && (
              <>
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: colors.borderLight },
                  ]}
                />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDelete}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.danger}
                    />
                  </View>
                  <Text
                    style={[styles.menuItemLabel, { color: colors.danger }]}
                  >
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
  },
);

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  triggerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
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
  menuItemIcon: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontSize: 15,
    flex: 1,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shortcut: {
    fontSize: 12,
    fontWeight: "500",
  },
  checkmark: {
    fontSize: 14,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 16,
  },
});
