import { useInterstitialAd } from "@/lib/ads";
import { BlockRenderer } from "@/components/BlockRenderer";
import { ImageViewer } from "@/components/ImageViewer";
import { ImageSourceMenu } from "@/components/ImageSourceMenu";
import {
  Block,
  BlockType,
  ImageBlockContent,
  createBlock,
  deleteBlock,
  getBlocksByNoteId,
  parseImageContent,
  textToChecklistContent,
  textToListContent,
  transformBlockType,
} from "@/lib/blocks.repository";
import { Category, getAllCategories } from "@/lib/categories.repository";
import {
  deleteNote,
  getNoteById,
  setNoteCategory,
  updateNoteTitle,
} from "@/lib/notes.repository";
import { processAndSaveImage, deleteImageFiles } from "@/lib/images.service";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useTheme } from "@/lib/theme";
import {
  markMarkdownShortcutHintShown,
  shouldShowMarkdownShortcutHint,
  type MarkdownShortcutHintType,
} from "@/lib/ux/hints";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NoteDetailScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const { id, autofocus } = useLocalSearchParams<{
    id: string;
    autofocus?: string;
  }>();
  const noteId = parseInt(id, 10);
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [autofocusBlockId, setAutofocusBlockId] = useState<number | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const [undoInfo, setUndoInfo] = useState<{ block: Block } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoInfoRef = useRef<{ block: Block } | null>(null);
  const [markdownHint, setMarkdownHint] = useState<MarkdownShortcutHintType | null>(null);
  const markdownHintRef = useRef<MarkdownShortcutHintType | null>(null);
  const markdownHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Image viewer state
  const [viewerImage, setViewerImage] = useState<ImageBlockContent | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showImageSourceMenu, setShowImageSourceMenu] = useState(false);
  const [pendingImageOrder, setPendingImageOrder] = useState<number | null>(null);
  const [pendingImageSourceBlockId, setPendingImageSourceBlockId] = useState<number | null>(null);
  const { pickFromGallery, takePhoto } = useImagePicker();

  // Interstitial ad
  const { startEditSession, showIfEligible } = useInterstitialAd();

  useFocusEffect(
    useCallback(() => {
      loadNote();
      startEditSession();
      return () => {
        if (titleTimeoutRef.current) {
          clearTimeout(titleTimeoutRef.current);
        }
      };
    }, [noteId]),
  );

  useEffect(() => {
    undoInfoRef.current = undoInfo;
  }, [undoInfo]);

  const loadNote = async () => {
    try {
      const [note, allCategories, noteBlocks] = await Promise.all([
        getNoteById(noteId),
        getAllCategories(),
        getBlocksByNoteId(noteId),
      ]);

      if (note) {
        setTitle(note.title);
        setCategoryId(note.category_id);
      }

      setCategories(allCategories);

      // Ensure there's always an empty text block at the end
      const lastBlock = noteBlocks[noteBlocks.length - 1];
      const needsEmptyBlock =
        noteBlocks.length === 0 ||
        lastBlock.type !== "text" ||
        (lastBlock.content && lastBlock.content.trim());

      if (needsEmptyBlock) {
        const newOrder = lastBlock ? lastBlock.order + 1000 : 1000;
        await createBlock(noteId, "text", newOrder, "");
        const updatedBlocks = await getBlocksByNoteId(noteId);
        setBlocks(updatedBlocks);
      } else {
        setBlocks(noteBlocks);
      }
    } catch (error) {
      console.error("Failed to load note:", error);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current);
    }
    titleTimeoutRef.current = setTimeout(() => {
      updateNoteTitle(noteId, newTitle).catch(console.error);
    }, 500);
  };

  const handleAddBlock = async () => {
    try {
      const lastBlock = blocks[blocks.length - 1];
      const newOrder = lastBlock ? lastBlock.order + 1000 : 1000;
      const newBlockId = await createBlock(noteId, "text", newOrder, "");
      setAutofocusBlockId(newBlockId);
      await loadNote();
    } catch (error) {
      console.error("Failed to add block:", error);
    }
  };

  const handleBlockUpdate = () => {
    loadNote();
  };

  const handleBlockTransform = async (
    blockId: number,
    newType: BlockType,
    newContent: string | null,
  ) => {
    try {
      // Convert content format if needed
      let finalContent = newContent;
      if (newType === "checklist") {
        finalContent = textToChecklistContent(newContent);
      } else if (newType === "list") {
        finalContent = textToListContent(newContent);
      }
      await transformBlockType(blockId, newType, finalContent);
      await loadNote();
      setAutofocusBlockId(blockId);
    } catch (error) {
      console.error("Failed to transform block:", error);
    }
  };

  const handleDeleteBlock = async (block: Block) => {
    try {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      // Delete image files if it's an image block
      if (block.type === "image") {
        const imageContent = parseImageContent(block.content);
        if (imageContent) {
          await deleteImageFiles(imageContent);
        }
      }
      await deleteBlock(block.id);
      setFocusedBlockId(null);
      focusedBlockIdRef.current = null;
      // Don't allow undo for image blocks (files are deleted)
      if (block.type !== "image") {
        setUndoInfo({ block });
        undoTimeoutRef.current = setTimeout(() => {
          setUndoInfo(null);
          undoTimeoutRef.current = null;
        }, 3000);
      }
      const remainingBlocks = await getBlocksByNoteId(noteId);
      if (remainingBlocks.length === 0) {
        const firstBlockId = await createBlock(noteId, "text", 1000, "");
        setAutofocusBlockId(firstBlockId);
      }
      await loadNote();
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  };

  const handleUndoDelete = async () => {
    if (!undoInfo) return;
    const { block } = undoInfo;
    const fallbackOrder =
      blocks.length > 0 ? blocks[blocks.length - 1].order + 1000 : 1000;
    const order = typeof block.order === "number" ? block.order : fallbackOrder;
    try {
      await createBlock(noteId, block.type, order, block.content ?? "");
      setUndoInfo(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = null;
      }
      await loadNote();
    } catch (error) {
      console.error("Failed to undo delete:", error);
    }
  };

  const handleInsertBlockBelow = async (
    afterBlockId: number,
    type: BlockType = "text",
  ) => {
    try {
      const currentIndex = blocks.findIndex((b) => b.id === afterBlockId);
      if (currentIndex === -1) return;

      const currentBlock = blocks[currentIndex];
      const nextBlock = blocks[currentIndex + 1];

      // Calculate order between current and next block
      let newOrder: number;
      if (nextBlock) {
        newOrder = (currentBlock.order + nextBlock.order) / 2;
      } else {
        newOrder = currentBlock.order + 1000;
      }

      // For image type, show source menu instead of creating block directly
      if (type === "image") {
        // Use the current block's order so the image replaces it (if empty)
        setPendingImageOrder(currentBlock.order);
        setPendingImageSourceBlockId(afterBlockId);
        setShowImageSourceMenu(true);
        return;
      }

      const newBlockId = await createBlock(noteId, type, newOrder, "");
      setAutofocusBlockId(newBlockId);
      await loadNote();
    } catch (error) {
      console.error("Failed to insert block:", error);
    }
  };

  const blockPositionsRef = useRef<Map<number, number>>(new Map());
  const focusedBlockIdRef = useRef<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to focused block when keyboard appears
        if (focusedBlockIdRef.current !== null) {
          const y = blockPositionsRef.current.get(focusedBlockIdRef.current);
          if (y !== undefined && scrollRef.current) {
            setTimeout(() => {
              scrollRef.current?.scrollTo({
                y: Math.max(0, y - 100),
                animated: true,
              });
            }, 100);
          }
        }
      },
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleBlockLayout = (blockId: number, y: number) => {
    blockPositionsRef.current.set(blockId, y);
  };

  const handleFocusBlock = (blockId: number) => {
    setFocusedBlockId(blockId);
    focusedBlockIdRef.current = blockId;
    const y = blockPositionsRef.current.get(blockId);
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 100), animated: true });
    }
  };

  const handleBlurAll = () => {
    setFocusedBlockId(null);
    focusedBlockIdRef.current = null;
    Keyboard.dismiss();
  };

  const handleDetectedMarkdownShortcut = useCallback(
    (type: MarkdownShortcutHintType) => {
      // Undo toast has priority; skip showing hints while it's visible.
      if (undoInfoRef.current) return;
      if (markdownHintRef.current) return;

      (async () => {
        try {
          const shouldShow = await shouldShowMarkdownShortcutHint(type);
          if (!shouldShow) return;

          await markMarkdownShortcutHintShown(type);

          // Re-check priority after async work.
          if (undoInfoRef.current) return;
          if (markdownHintRef.current) return;

          markdownHintRef.current = type;
          setMarkdownHint(type);

          if (markdownHintTimeoutRef.current) {
            clearTimeout(markdownHintTimeoutRef.current);
          }
          markdownHintTimeoutRef.current = setTimeout(() => {
            markdownHintRef.current = null;
            setMarkdownHint(null);
            markdownHintTimeoutRef.current = null;
          }, 2500);
        } catch (error) {
          console.error("Failed to show markdown shortcut hint:", error);
        }
      })();
    },
    [],
  );

  const handleBack = async () => {
    await showIfEligible();
    router.back();
  };

  const getCurrentCategory = () => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId) || null;
  };

  const handleSelectCategory = async (newCategoryId: number | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await setNoteCategory(noteId, newCategoryId);
      setCategoryId(newCategoryId);
      setShowCategoryPicker(false);
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleDeleteNote = () => {
    Alert.alert(t("notes.deleteNoteTitle"), t("notes.deleteNoteMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNote(noteId);
            router.back();
          } catch (error) {
            console.error("Failed to delete note:", error);
          }
        },
      },
    ]);
  };

  const handleAddImage = async (source: "camera" | "gallery") => {
    setShowImageSourceMenu(false);

    const sourceBlockId = pendingImageSourceBlockId;
    setPendingImageSourceBlockId(null);

    try {
      const result =
        source === "camera" ? await takePhoto() : await pickFromGallery();

      if (!result) {
        setPendingImageOrder(null);
        return;
      }

      // Use pending order if set, otherwise add at end
      const newOrder = pendingImageOrder ?? (blocks.length > 0 ? blocks[blocks.length - 1].order + 1000 : 1000);
      setPendingImageOrder(null);

      // Process and save image
      const { content } = await processAndSaveImage(
        result.uri,
        noteId,
        result.width,
        result.height
      );

      // If source block is empty, delete it (image replaces it)
      if (sourceBlockId) {
        const sourceBlock = blocks.find((b) => b.id === sourceBlockId);
        if (sourceBlock && (!sourceBlock.content || !sourceBlock.content.trim())) {
          await deleteBlock(sourceBlockId);
        }
      }

      // Create the image block
      await createBlock(noteId, "image", newOrder, JSON.stringify(content));
      await loadNote();
    } catch (error) {
      console.error("Failed to add image:", error);
      setPendingImageOrder(null);
    }
  };

  const handleImagePress = (content: ImageBlockContent) => {
    setViewerImage(content);
    setShowImageViewer(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
                <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.headerBackground }]}>
                  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={20} color={colors.headerText} />
                    <Text style={[styles.backText, { color: colors.headerText }]}>{t("common.back")}</Text>
                  </TouchableOpacity>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      onPress={handleDeleteNote}
                      style={styles.menuButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

        <ScrollView
          ref={scrollRef}
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: Math.max(100, keyboardHeight) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          onTouchStart={() => {
            // Touches inside a ScrollView don't reliably bubble to wrappers.
            // Use this to clear the focused block highlight when tapping outside,
            // even if the keyboard is already closed.
            handleBlurAll();
          }}
        >
              <View style={[styles.titleSection, { backgroundColor: colors.backgroundTertiary, borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity
                  onPress={() => setShowCategoryPicker(true)}
                  style={[styles.categoryDisplay, { backgroundColor: colors.background }]}
                >
                  {getCurrentCategory() ? (
                    <>
                      <View
                        style={[
                          styles.categoryDot,
                          {
                            backgroundColor: getCurrentCategory()?.color,
                          },
                        ]}
                      />
                      <Text style={[styles.categoryNameText, { color: colors.textSecondary }]}>
                        {getCurrentCategory()?.title}
                      </Text>
                    </>
                  ) : (
                    <View style={styles.categoryPlaceholderRow}>
                      <Ionicons
                        name="pricetag-outline"
                        size={14}
                        color={colors.placeholder}
                        style={styles.categoryPlaceholderIcon}
                      />
                      <Text style={[styles.categoryPlaceholderText, { color: colors.textMuted }]}>
                        {t("categories.uncategorized")}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TextInput
                  style={[styles.titleInput, { color: colors.text }]}
                  value={title}
                  onChangeText={handleTitleChange}
                  placeholder={t("notes.notePlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  onFocus={() => setFocusedBlockId(null)}
                />
              </View>

            {blocks.map((block, index) => {
              const isFocused = focusedBlockId === block.id;
              const shouldShowSlashPlaceholder =
                title.trim() === "" &&
                blocks.length === 1 &&
                blocks[0]?.type === "text" &&
                !((blocks[0]?.content ?? "").trim());
              return (
                <View
                  key={block.id}
                  onLayout={(e) =>
                    handleBlockLayout(block.id, e.nativeEvent.layout.y)
                  }
                >
                  <View
                    style={isFocused ? [styles.focusedBlockContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }] : undefined}
                  >
                    <BlockRenderer
                      block={block}
                      onUpdate={handleBlockUpdate}
                    onTransform={handleBlockTransform}
                    autoFocus={
                      (autofocus === "1" && index === 0) ||
                      autofocusBlockId === block.id
                    }
                    isFocused={isFocused}
                    textPlaceholder={
                      shouldShowSlashPlaceholder && index === 0
                        ? t("blocks.textPlaceholderWithSlash")
                        : ""
                    }
                    showSlashHint={index === 0}
                    onDetectedMarkdownShortcut={handleDetectedMarkdownShortcut}
                    onFocusBlock={() => handleFocusBlock(block.id)}
                    onInsertBlockBelow={handleInsertBlockBelow}
                    onDeleteBlock={handleDeleteBlock}
                    onImagePress={handleImagePress}
                  />
                  </View>
                {/* Insert block button between blocks */}
                {isFocused && (
                  <TouchableOpacity
                    style={styles.insertBlockButton}
                    onPress={() => handleInsertBlockBelow(block.id)}
                  >
                    <View style={[styles.insertBlockLine, { backgroundColor: colors.border }]} />
                    <Ionicons
                      name="add"
                      size={16}
                      color={colors.placeholder}
                      style={styles.insertBlockIcon}
                    />
                    <View style={[styles.insertBlockLine, { backgroundColor: colors.border }]} />
                  </TouchableOpacity>
                )}
                </View>
              );
            })}

            {blocks.length === 0 && (
              <TouchableOpacity
                onPress={handleAddBlock}
                style={[styles.addBlockButton, { backgroundColor: colors.backgroundSecondary }]}
              >
                <Ionicons name="add" size={24} color={colors.placeholder} />
              </TouchableOpacity>
            )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
          onPress={() => setShowCategoryPicker(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.modalBackground, paddingBottom: insets.bottom + 20 }]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Text style={[styles.modalCancelText, { color: colors.primary }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("categories.category")}</Text>
              <View style={{ width: 60 }} />
            </View>

            <FlatList
              data={[
                { id: null, title: t("categories.uncategorized"), color: null },
                ...categories,
              ]}
              keyExtractor={(item) => (item.id ?? "uncategorized").toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    { borderBottomColor: colors.border },
                    categoryId === item.id && { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : '#f0f8ff' },
                  ]}
                  onPress={() => handleSelectCategory(item.id)}
                >
                  {item.color && (
                    <View
                      style={[
                        styles.categoryOptionDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.categoryOptionText,
                      { color: colors.text },
                      categoryId === item.id && styles.categoryOptionTextSelected,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {categoryId === item.id && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {markdownHint && !undoInfo && (
        <Pressable
          onPress={() => {
            markdownHintRef.current = null;
            setMarkdownHint(null);
            if (markdownHintTimeoutRef.current) {
              clearTimeout(markdownHintTimeoutRef.current);
              markdownHintTimeoutRef.current = null;
            }
          }}
          style={[
            styles.hintToast,
            {
              backgroundColor: colors.toastBackground,
              bottom: Math.max(16, keyboardHeight + 16),
            },
          ]}
        >
          <Text style={[styles.hintToastText, { color: colors.toastText }]}>
            {markdownHint === "list"
              ? t("hints.listShortcut")
              : t("hints.checklistShortcut")}
          </Text>
        </Pressable>
      )}

      {undoInfo && (
        <View
          style={[
            styles.undoToast,
            { backgroundColor: colors.toastBackground, bottom: Math.max(16, keyboardHeight + 16) },
          ]}
        >
          <Text style={[styles.undoText, { color: colors.toastText }]}>{t("blocks.deleted")}</Text>
          <TouchableOpacity onPress={handleUndoDelete}>
            <Text style={[styles.undoAction, { color: colors.toastAction }]}>{t("blocks.undo")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ImageViewer
        visible={showImageViewer}
        imageContent={viewerImage}
        onClose={() => setShowImageViewer(false)}
      />

      <ImageSourceMenu
        visible={showImageSourceMenu}
        onSelectSource={handleAddImage}
        onClose={() => {
          setShowImageSourceMenu(false);
          setPendingImageOrder(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: 16,
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  titleSection: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryNameText: {
    fontSize: 14,
    marginLeft: 6,
  },
  categoryPlaceholderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryPlaceholderIcon: {
    marginRight: 6,
  },
  categoryPlaceholderText: {
    fontSize: 14,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "700",
    padding: 0,
    minHeight: 32,
  },
  focusedBlockContainer: {
    borderRadius: 4,
  },
  addBlockButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  insertBlockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    marginVertical: 0,
    opacity: 0.4,
  },
  insertBlockLine: {
    flex: 1,
    height: 1,
  },
  insertBlockIcon: {
    marginHorizontal: 8,
  },
  undoToast: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  undoText: {
    fontSize: 14,
  },
  undoAction: {
    fontSize: 14,
    fontWeight: "600",
  },
  hintToast: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  hintToastText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    maxHeight: "70%",
    minHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalCancelText: {
    fontSize: 16,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryOptionSelected: {},
  categoryOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 16,
  },
  categoryOptionTextSelected: {
    fontWeight: "600",
  },
});
