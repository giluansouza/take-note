import { BannerAdView } from "@/components/BannerAdView";
import {
  Category,
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
  updateCategoryPositions,
} from "@/lib/categories.repository";
import { createBlock, parseChecklistContent, parseListContent } from "@/lib/blocks.repository";
import {
  archiveNote,
  createNote,
  deleteNote,
  getAllNotesWithPreview,
  NoteWithPreview,
  setNoteCategory,
  unarchiveNote,
} from "@/lib/notes.repository";
import { formatFallbackTitle } from "@/lib/title";
import { useTheme } from "@/lib/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORY_COLORS = [
  "#FF6B6B", // Red
  "#FF8E53", // Orange
  "#FFD93D", // Yellow
  "#6BCB77", // Green
  "#4ECDC4", // Teal
  "#45B7D1", // Light Blue
  "#5C7AEA", // Blue
  "#A66CFF", // Purple
  "#FF6B9D", // Pink
  "#95A5A6", // Gray
];

type CategoryFilter = "all" | "uncategorized" | number;
type ViewMode = "list" | "grid";

const VIEW_MODE_KEY = "@notes_view_mode";

export default function NotesListScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<NoteWithPreview[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("all");
  const [noteCounts, setNoteCounts] = useState<{ [key: string]: number }>({});
  const swipeableRefs = useRef<Map<number, Swipeable>>(new Map());
  const [undoArchive, setUndoArchive] = useState<NoteWithPreview | null>(null);
  const undoArchiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Category creation modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [showCategoryOptionsModal, setShowCategoryOptionsModal] = useState(false);
  const [categoryOptionsId, setCategoryOptionsId] = useState<number | null>(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderList, setReorderList] = useState<Category[]>([]);

  // Note selection modal state
  const [showNoteSelectionModal, setShowNoteSelectionModal] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [allNotesForSelection, setAllNotesForSelection] = useState<NoteWithPreview[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<number>>(
    new Set(),
  );

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Load saved view mode
  useEffect(() => {
    AsyncStorage.getItem(VIEW_MODE_KEY).then((saved) => {
      if (saved === "list" || saved === "grid") {
        setViewMode(saved);
      }
    });
  }, []);

  const toggleViewMode = async () => {
    const newMode = viewMode === "list" ? "grid" : "list";
    setViewMode(newMode);
    await AsyncStorage.setItem(VIEW_MODE_KEY, newMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const calculateNoteCounts = (
    notesToCount: NoteWithPreview[],
    allCategories: Category[],
  ) => {
    const counts: { [key: string]: number } = {};
    // Initialize counts for all existing categories to 0
    allCategories.forEach((cat) => {
      counts[cat.id] = 0;
    });
    counts["uncategorized"] = 0;

    // Tally the counts from the notes
    notesToCount.forEach((note) => {
      if (note.category_id && counts.hasOwnProperty(note.category_id)) {
        counts[note.category_id]++;
      } else {
        counts["uncategorized"]++;
      }
    });
    return counts;
  };

  const loadData = async () => {
    try {
      const [allCategories, allNotesForCounting] = await Promise.all([
        getAllCategories(),
        getAllNotesWithPreview({}), // Fetch all notes for counting
      ]);
      setCategories(allCategories);

      const counts = calculateNoteCounts(allNotesForCounting, allCategories);
      setNoteCounts(counts);

      await loadNotes(); // This reloads notes with current filters
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const loadNotes = async () => {
    try {
      const filter: { search?: string; categoryId?: number | null } = {};

      if (searchText.trim()) {
        filter.search = searchText.trim();
      }

      if (selectedCategory === "uncategorized") {
        filter.categoryId = null;
      } else if (typeof selectedCategory === "number") {
        filter.categoryId = selectedCategory;
      }

      const allNotes = await getAllNotesWithPreview(filter);
      setNotes(allNotes);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  // Reload notes when filter changes
  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [searchText, selectedCategory]),
  );

  const handleCreateNote = async () => {
    try {
      const id = await createNote("");
      // Create an initial text block for the new note
      await createBlock(id, "text", 1000, "");
      router.push({ pathname: "/note/[id]", params: { id: String(id), autofocus: "1" } });
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleNotePress = (id: number) => {
    router.push(`/note/${id}`);
  };

  const handleArchive = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const archivedNote = notes.find((note) => note.id === id) || null;
      await archiveNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      if (archivedNote) {
        if (undoArchiveTimeoutRef.current) {
          clearTimeout(undoArchiveTimeoutRef.current);
        }
        setUndoArchive(archivedNote);
        undoArchiveTimeoutRef.current = setTimeout(() => {
          setUndoArchive(null);
          undoArchiveTimeoutRef.current = null;
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to archive note:", error);
    }
  };

  const handleUndoArchive = async () => {
    if (!undoArchive) return;
    try {
      await unarchiveNote(undoArchive.id);
      setUndoArchive(null);
      if (undoArchiveTimeoutRef.current) {
        clearTimeout(undoArchiveTimeoutRef.current);
        undoArchiveTimeoutRef.current = null;
      }
      await loadNotes();
    } catch (error) {
      console.error("Failed to undo archive:", error);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(t("notes.deleteNoteTitle"), t("notes.deleteNoteMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
        onPress: () => {
          swipeableRefs.current.get(id)?.close();
        },
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          try {
            await deleteNote(id);
            setNotes((prev) => prev.filter((note) => note.id !== id));
          } catch (error) {
            console.error("Failed to delete note:", error);
          }
        },
      },
    ]);
  };

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  const handleCategoryPress = (category: CategoryFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleOpenCategoryModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewCategoryName("");
    setSelectedColor(null);
    setShowCategoryModal(true);
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setNewCategoryName("");
    setSelectedColor(null);
  };

  const handleOpenCategoryOptions = (categoryId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryOptionsId(categoryId);
    setShowCategoryOptionsModal(true);
  };

  const handleCloseCategoryOptions = () => {
    setShowCategoryOptionsModal(false);
    setCategoryOptionsId(null);
  };

  const handleOpenEditCategory = () => {
    if (categoryOptionsId === null) return;
    const category = categories.find((c) => c.id === categoryOptionsId);
    if (!category) return;
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.title);
    setEditingColor(category.color);
    setShowEditCategoryModal(true);
    handleCloseCategoryOptions();
  };

  const handleCloseEditCategory = () => {
    setShowEditCategoryModal(false);
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setEditingColor(null);
  };

  const handleSaveEditCategory = async () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateCategory(editingCategoryId, editingCategoryName.trim(), editingColor);
      handleCloseEditCategory();
      const allCategories = await getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleDeleteCategory = async () => {
    if (categoryOptionsId === null) return;
    const category = categories.find((c) => c.id === categoryOptionsId);
    if (!category) return;
    Alert.alert(
      t("categories.deleteCategory"),
      t("categories.deleteCategoryMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              handleCloseCategoryOptions();
              const allCategories = await getAllCategories();
              setCategories(allCategories);
              await loadNotes();
            } catch (error) {
              console.error("Failed to delete category:", error);
            }
          },
        },
      ],
    );
  };

  const handleOpenReorder = () => {
    setReorderList([...categories]);
    setShowReorderModal(true);
    handleCloseCategoryOptions();
  };

  const handleCloseReorder = () => {
    setShowReorderModal(false);
    setReorderList([]);
  };

  const moveCategory = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= reorderList.length) return;
    const updated = [...reorderList];
    const [item] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, item);
    setReorderList(updated);
  };

  const handleSaveReorder = async () => {
    try {
      const updates = reorderList.map((c, index) => ({ id: c.id, position: index }));
      await updateCategoryPositions(updates);
      handleCloseReorder();
      const allCategories = await getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error("Failed to reorder categories:", error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createCategory(newCategoryName.trim(), selectedColor);
      setShowCategoryModal(false);
      setNewCategoryName("");
      setSelectedColor(null);

      // Refresh categories list
      const allCategories = await getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleCreateCategoryAndAddNotes = async () => {
    if (!newCategoryName.trim()) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const categoryId = await createCategory(
        newCategoryName.trim(),
        selectedColor,
      );
      setNewCategoryId(categoryId);
      setShowCategoryModal(false);
      setNewCategoryName("");
      setSelectedColor(null);

      // Refresh categories list
      const allCategories = await getAllCategories();
      setCategories(allCategories);

      // Load all uncategorized notes for selection
      const uncategorizedNotes = await getAllNotesWithPreview({ categoryId: null });
      setAllNotesForSelection(uncategorizedNotes);
      setSelectedNoteIds(new Set());
      setShowNoteSelectionModal(true);
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleCloseNoteSelectionModal = () => {
    setShowNoteSelectionModal(false);
    setNewCategoryId(null);
    setAllNotesForSelection([]);
    setSelectedNoteIds(new Set());
    setNewCategoryName("");
  };

  const handleToggleNoteSelection = async (noteId: number) => {
    if (!newCategoryId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isSelected = selectedNoteIds.has(noteId);
    setSelectedNoteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
    try {
      await setNoteCategory(noteId, isSelected ? null : newCategoryId);
      await loadNotes();
    } catch (error) {
      console.error("Failed to update note category:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryColor = (categoryId: number | null) => {
    if (!categoryId) return null;
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || null;
  };

  const getCategory = (categoryId: number | null) => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId) || null;
  };

  const getPreviewText = (note: NoteWithPreview) => {
    const content = note.first_block_content;
    const type = note.first_block_type;

    if (!content || !type) return null;
    const trimmed = content.trim();
    if (!trimmed) return null;

    switch (type) {
      case 'checklist':
        try {
          const parsed = parseChecklistContent(trimmed);
          if (parsed.length > 0) {
            const firstItemText = parsed[0].text.trim();
            return firstItemText || null;
          }
        } catch {
          return null;
        }
        return null;
      case 'list':
        try {
          const parsed = parseListContent(trimmed);
          if (parsed.length > 0) {
            const firstItemText = parsed[0].text.trim();
            return firstItemText || null;
          }
        } catch {
          return null;
        }
        return null;
      case 'text':
      default:
        const firstLine = trimmed.split("\n")[0]?.trim();
        return firstLine || null;
    }
  };

  const isLegacyTitle = (value: string) => {
    const trimmed = value.trim();
    return !trimmed || trimmed === "Untitled" || trimmed === "Sem título";
  };

  const renderLeftActions = () => (
    <View style={[styles.archiveAction, { backgroundColor: colors.primary }]}>
      <Text style={[styles.actionText, { color: colors.textInverse }]}>{t("notes.archive")}</Text>
    </View>
  );

  const renderRightActions = () => (
    <View style={[styles.deleteAction, { backgroundColor: colors.danger }]}>
      <Text style={[styles.actionText, { color: colors.textInverse }]}>{t("notes.delete")}</Text>
    </View>
  );

  const renderNote = ({ item }: { item: NoteWithPreview }) => {
    const category = getCategory(item.category_id);
    const categoryColor = getCategoryColor(item.category_id);
    const previewText = getPreviewText(item);
    const displayTitle = isLegacyTitle(item.title)
      ? formatFallbackTitle(new Date(item.created_at), i18n.language)
      : item.title;

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
        }}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableOpen={(direction) => {
          if (direction === "left") {
            handleArchive(item.id);
          } else {
            handleDelete(item.id);
          }
        }}
        overshootLeft={false}
        overshootRight={false}
      >
        <TouchableOpacity
          style={[styles.noteItem, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
          onPress={() => handleNotePress(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.noteContent}>
            <View style={styles.noteTextContent}>
              <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
                {displayTitle}
              </Text>
              {previewText && (
                <Text style={[styles.notePreview, { color: colors.textTertiary }]} numberOfLines={1}>
                  {previewText}
                </Text>
              )}
              <View style={styles.noteMetaRow}>
                <Text style={[styles.noteDate, { color: colors.textMuted }]}>{formatDate(item.created_at)}</Text>
                {category && (
                  <View style={[styles.categoryChip, { backgroundColor: colors.background }]}>
                    {categoryColor && (
                      <View
                        style={[
                          styles.categoryChipDot,
                          { backgroundColor: categoryColor },
                        ]}
                      />
                    )}
                    <Text style={[styles.categoryChipText, { color: colors.textTertiary }]}>{category.title}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderNoteCard = ({ item }: { item: NoteWithPreview }) => {
    const category = getCategory(item.category_id);
    const categoryColor = getCategoryColor(item.category_id);
    const previewText = getPreviewText(item);
    const displayTitle = isLegacyTitle(item.title)
      ? formatFallbackTitle(new Date(item.created_at), i18n.language)
      : item.title;

    return (
      <TouchableOpacity
        style={[styles.noteCard, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => handleNotePress(item.id)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert(
            displayTitle || t("notes.untitled"),
            undefined,
            [
              { text: t("notes.archive"), onPress: () => handleArchive(item.id) },
              { text: t("notes.delete"), style: "destructive", onPress: () => handleDelete(item.id) },
              { text: t("common.cancel"), style: "cancel" },
            ]
          );
        }}
        activeOpacity={0.7}
      >
        {categoryColor && (
          <View style={[styles.cardCategoryBar, { backgroundColor: categoryColor }]} />
        )}
        <View style={styles.cardContent}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {displayTitle || t("notes.untitled")}
            </Text>
            {previewText && (
              <Text style={[styles.cardPreview, { color: colors.textTertiary }]} numberOfLines={4}>
                {previewText}
              </Text>
            )}
          </View>
          <Text style={[styles.cardDate, { color: colors.placeholder }]}>{formatDate(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const isFiltering = searchText.trim() !== "" || selectedCategory !== "all";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.headerBackground }]}>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t("notes.title")}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleOpenSettings}
            style={styles.headerButton}
          >
            <Ionicons name="settings-outline" size={20} color={colors.headerText} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.filterContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t("notes.searchPlaceholder")}
              placeholderTextColor={colors.placeholder}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchText("")}
              >
                <Text style={[styles.clearButtonText, { color: colors.placeholder }]}>×</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={[styles.viewToggle, { backgroundColor: colors.backgroundSecondary }]} onPress={toggleViewMode}>
            <Ionicons
              name={viewMode === "list" ? "grid-outline" : "list-outline"}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBadges}
        >
          <TouchableOpacity
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.backgroundSecondary },
              selectedCategory === "all" && { backgroundColor: colors.backgroundInverse },
            ]}
            onPress={() => handleCategoryPress("all")}
          >
            <Text
              style={[
                styles.categoryBadgeText,
                { color: colors.textSecondary },
                selectedCategory === "all" && { color: colors.textInverse },
              ]}
            >
              {t("categories.all")}
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryBadge,
                { backgroundColor: colors.backgroundSecondary },
                selectedCategory === category.id && { backgroundColor: colors.backgroundInverse },
              ]}
              onPress={() => handleCategoryPress(category.id)}
              onLongPress={() => handleOpenCategoryOptions(category.id)}
            >
              {category.color && (
                <View
                  style={[
                    styles.categoryBadgeDot,
                    { backgroundColor: category.color },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.categoryBadgeText,
                  { color: colors.textSecondary },
                  selectedCategory === category.id && { color: colors.textInverse },
                ]}
              >
                {category.title}
                {noteCounts[category.id] ? `  ${noteCounts[category.id]}` : ''}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.backgroundSecondary },
              selectedCategory === "uncategorized" && { backgroundColor: colors.backgroundInverse },
            ]}
            onPress={() => handleCategoryPress("uncategorized")}
          >
            <Text
              style={[
                styles.categoryBadgeText,
                { color: colors.textSecondary },
                selectedCategory === "uncategorized" && { color: colors.textInverse },
              ]}
            >
              {t("categories.uncategorized")}
              {noteCounts['uncategorized'] !== undefined ? `  ${noteCounts['uncategorized']}` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addCategoryBadge, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={handleOpenCategoryModal}
          >
            <Text style={[styles.addCategoryBadgeText, { color: colors.textTertiary }]}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        key={viewMode}
        data={notes}
        style={{ flex: 1 }}
        keyExtractor={(item) => item.id.toString()}
        renderItem={viewMode === "list" ? renderNote : renderNoteCard}
        numColumns={viewMode === "grid" ? 2 : 1}
        contentContainerStyle={[
          viewMode === "grid" ? styles.gridContent : styles.listContent,
          { backgroundColor: colors.backgroundSecondary },
        ]}
        columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {isFiltering ? t("notes.noNotesFiltered") : t("notes.noNotes")}
            </Text>
            {!isFiltering && (
              <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>{t("notes.createFirst")}</Text>
            )}
          </View>
        }
      />

      <BannerAdView />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.backgroundInverse }]}
        onPress={handleCreateNote}
        activeOpacity={0.8}
      >
        <Text style={[styles.fabText, { color: colors.textInverse }]}>+</Text>
      </TouchableOpacity>

      {undoArchive && (
        <View style={[styles.undoToast, { backgroundColor: colors.toastBackground }]}>
          <Text style={[styles.undoText, { color: colors.toastText }]}>{t("notes.archivedNotice")}</Text>
          <TouchableOpacity onPress={handleUndoArchive}>
            <Text style={[styles.undoAction, { color: colors.toastAction }]}>{t("notes.undo")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category Creation Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseCategoryModal}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]} onPress={handleCloseCategoryModal}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.modalBackground, paddingBottom: insets.bottom + 20 }]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseCategoryModal}>
                <Text style={[styles.modalCancelText, { color: colors.primary }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("categories.newCategory")}
              </Text>
              <TouchableOpacity
                onPress={handleCreateCategory}
                disabled={!newCategoryName.trim()}
              >
                <Text
                  style={[
                    styles.modalActionText,
                    { color: colors.primary },
                    !newCategoryName.trim() && { color: colors.placeholder },
                  ]}
                >
                  {t("categories.create")}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.categoryInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder={t("categories.categoryName")}
              placeholderTextColor={colors.placeholder}
              autoFocus
            />

            <Text style={[styles.colorPickerLabel, { color: colors.textTertiary }]}>
              {t("categories.selectColor")}
            </Text>
            <View style={styles.colorPicker}>
              {CATEGORY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && [styles.colorOptionSelected, { borderColor: colors.text }],
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedColor(selectedColor === color ? null : color);
                  }}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.addNotesButton,
                { backgroundColor: colors.backgroundInverse },
                !newCategoryName.trim() && { backgroundColor: colors.border },
              ]}
              onPress={handleCreateCategoryAndAddNotes}
              disabled={!newCategoryName.trim()}
            >
              <Text
                style={[
                  styles.addNotesButtonText,
                  { color: colors.textInverse },
                  !newCategoryName.trim() && { color: colors.placeholder },
                ]}
              >
                {t("categories.createAndAddNotes")}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Note Selection Modal */}
      <Modal
        visible={showNoteSelectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseNoteSelectionModal}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]} onPress={handleCloseNoteSelectionModal}>
          <Pressable
            style={[
              styles.modalContent,
              styles.noteSelectionModal,
              { backgroundColor: colors.modalBackground, paddingBottom: insets.bottom + 20 },
            ]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseNoteSelectionModal}>
                <Text style={[styles.modalCancelText, { color: colors.primary }]}>
                  {t("categories.skip")}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("categories.addNotesToCategory")}
              </Text>
              <View style={{ width: 60 }} />
            </View>

            <Text style={[styles.noteSelectionSubtitle, { color: colors.textTertiary }]}>
              {t("categories.selectNotes")}
            </Text>

            {allNotesForSelection.length === 0 ? (
              <View style={styles.emptyNoteSelection}>
                <Text style={[styles.emptyNoteSelectionText, { color: colors.textMuted }]}>
                  {t("categories.noNotesAvailable")}
                </Text>
              </View>
            ) : (
              <FlatList
                data={allNotesForSelection}
                keyExtractor={(item) => item.id.toString()}
                style={styles.noteSelectionList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.noteSelectionItem,
                      { borderBottomColor: colors.border },
                      selectedNoteIds.has(item.id) && { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : '#f0f8ff' },
                    ]}
                    onPress={() => handleToggleNoteSelection(item.id)}
                  >
                    <View
                      style={[
                        styles.noteSelectionCheckbox,
                        { borderColor: colors.border },
                        selectedNoteIds.has(item.id) && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      {selectedNoteIds.has(item.id) && (
                        <Text style={[styles.noteSelectionCheckmark, { color: colors.textInverse }]}>✓</Text>
                      )}
                    </View>
                    <View style={styles.noteSelectionTextContent}>
                      <Text style={[styles.noteSelectionTitle, { color: colors.text }]} numberOfLines={1}>
                        {isLegacyTitle(item.title)
                          ? formatFallbackTitle(
                              new Date(item.created_at),
                              i18n.language,
                            )
                          : item.title}
                      </Text>
                      <Text style={[styles.noteSelectionDate, { color: colors.textMuted }]}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                />
              )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Category Options Modal */}
      <Modal
        visible={showCategoryOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseCategoryOptions}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]} onPress={handleCloseCategoryOptions}>
          <Pressable style={[styles.optionsMenu, { backgroundColor: colors.modalBackground }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("categories.category")}</Text>
            <TouchableOpacity style={styles.menuItem} onPress={handleOpenEditCategory}>
              <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>{t("common.edit")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteCategory}>
              <Text style={[styles.menuItemText, { color: colors.danger }]}>{t("common.delete")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleOpenReorder}>
              <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>{t("categories.reorderList")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        visible={showEditCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseEditCategory}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]} onPress={handleCloseEditCategory}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.modalBackground, paddingBottom: insets.bottom + 20 }]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseEditCategory}>
                <Text style={[styles.modalCancelText, { color: colors.primary }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("categories.editCategory")}</Text>
              <TouchableOpacity
                onPress={handleSaveEditCategory}
                disabled={!editingCategoryName.trim()}
              >
                <Text
                  style={[
                    styles.modalActionText,
                    { color: colors.primary },
                    !editingCategoryName.trim() && { color: colors.placeholder },
                  ]}
                >
                  {t("common.save")}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.categoryInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={editingCategoryName}
              onChangeText={setEditingCategoryName}
              placeholder={t("categories.categoryName")}
              placeholderTextColor={colors.placeholder}
              autoFocus
            />

            <Text style={[styles.colorPickerLabel, { color: colors.textTertiary }]}>
              {t("categories.selectColor")}
            </Text>
            <View style={styles.colorPicker}>
              {CATEGORY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    editingColor === color && [styles.colorOptionSelected, { borderColor: colors.text }],
                  ]}
                  onPress={() => setEditingColor(color)}
                />
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reorder Categories Modal */}
      <Modal
        visible={showReorderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseReorder}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]} onPress={handleCloseReorder}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.modalBackground, paddingBottom: insets.bottom + 20 }]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseReorder}>
                <Text style={[styles.modalCancelText, { color: colors.primary }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("categories.reorderList")}</Text>
              <TouchableOpacity onPress={handleSaveReorder}>
                <Text style={[styles.modalActionText, { color: colors.primary }]}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={reorderList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <View style={[styles.reorderRow, { borderBottomColor: colors.borderLight }]}>
                  <Text style={[styles.reorderText, { color: colors.textSecondary }]}>{item.title}</Text>
                  <View style={styles.reorderActions}>
                    <TouchableOpacity
                      onPress={() => moveCategory(index, index - 1)}
                      disabled={index === 0}
                      style={styles.reorderButton}
                    >
                      <Ionicons name="chevron-up" size={18} color={index === 0 ? colors.border : colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveCategory(index, index + 1)}
                      disabled={index === reorderList.length - 1}
                      style={styles.reorderButton}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={index === reorderList.length - 1 ? colors.border : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerButton: {
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 16,
  },
  filterContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 18,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 20,
  },
  categoryBadges: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderRadius: 20,
  },
  categoryBadgeSelected: {},
  categoryBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  categoryBadgeTextSelected: {},
  listContent: {
    flexGrow: 1,
  },
  gridContent: {
    flexGrow: 1,
    padding: 12,
  },
  gridRow: {
    justifyContent: "space-between",
  },
  noteCard: {
    width: "48%",
    minHeight: 180,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardCategoryBar: {
    height: 4,
    width: "100%",
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  cardPreview: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  cardDate: {
    fontSize: 12,
  },
  noteItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  noteContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  noteTextContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 4,
  },
  notePreview: {
    fontSize: 14,
    marginBottom: 6,
  },
  noteMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteDate: {
    fontSize: 13,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 12,
  },
  archiveAction: {
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    flex: 1,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    flex: 1,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
  undoToast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
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
  addCategoryBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addCategoryBadgeText: {
    fontSize: 20,
    fontWeight: "300",
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
    minHeight: "70%",
  },
  optionsMenu: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 220,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuItemText: {
    fontSize: 16,
  },
  reorderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reorderText: {
    flex: 1,
    fontSize: 16,
  },
  reorderActions: {
    flexDirection: "row",
    gap: 8,
  },
  reorderButton: {
    padding: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryInput: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  colorPickerLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorOptionSelected: {
    borderWidth: 3,
  },
  addNotesButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  addNotesButtonDisabled: {},
  addNotesButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  addNotesButtonTextDisabled: {},
  noteSelectionModal: {
    maxHeight: "80%",
  },
  noteSelectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  noteSelectionList: {
    flexGrow: 0,
  },
  noteSelectionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  noteSelectionItemSelected: {},
  noteSelectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noteSelectionCheckboxSelected: {},
  noteSelectionCheckmark: {
    fontSize: 14,
    fontWeight: "600",
  },
  noteSelectionTextContent: {
    flex: 1,
  },
  noteSelectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  noteSelectionDate: {
    fontSize: 13,
  },
  emptyNoteSelection: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyNoteSelectionText: {
    fontSize: 16,
  },
});
