import {
  Category,
  createCategory,
  getAllCategories,
} from "@/lib/categories.repository";
import {
  archiveNote,
  createNote,
  deleteNote,
  getAllNotes,
  Note,
  setNoteCategory,
} from "@/lib/notes.repository";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
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

export default function NotesListScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("all");
  const swipeableRefs = useRef<Map<number, Swipeable>>(new Map());

  // Category creation modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Note selection modal state
  const [showNoteSelectionModal, setShowNoteSelectionModal] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [allNotesForSelection, setAllNotesForSelection] = useState<Note[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<number>>(
    new Set(),
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      const [allCategories] = await Promise.all([getAllCategories()]);
      setCategories(allCategories);
      await loadNotes();
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

      const allNotes = await getAllNotes(filter);
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
      const id = await createNote(t("notes.untitled"));
      router.push(`/note/${id}`);
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
      await archiveNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (error) {
      console.error("Failed to archive note:", error);
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

  const handleOpenArchived = () => {
    router.push("/archived");
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
      const uncategorizedNotes = await getAllNotes({ categoryId: null });
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

  const handleToggleNoteSelection = (noteId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNoteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleAddNotesToCategory = async () => {
    if (!newCategoryId || selectedNoteIds.size === 0) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const promises = Array.from(selectedNoteIds).map((noteId) =>
        setNoteCategory(noteId, newCategoryId),
      );
      await Promise.all(promises);

      handleCloseNoteSelectionModal();
      await loadNotes();
    } catch (error) {
      console.error("Failed to add notes to category:", error);
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

  const renderLeftActions = () => (
    <View style={styles.archiveAction}>
      <Text style={styles.actionText}>{t("notes.archive")}</Text>
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.deleteAction}>
      <Text style={styles.actionText}>{t("notes.delete")}</Text>
    </View>
  );

  const renderNote = ({ item }: { item: Note }) => {
    const categoryColor = getCategoryColor(item.category_id);

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
          style={styles.noteItem}
          onPress={() => handleNotePress(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.noteContent}>
            {categoryColor && (
              <View
                style={[
                  styles.categoryIndicator,
                  { backgroundColor: categoryColor },
                ]}
              />
            )}
            <View style={styles.noteTextContent}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {item.title || t("notes.untitled")}
              </Text>
              <Text style={styles.noteDate}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const isFiltering = searchText.trim() !== "" || selectedCategory !== "all";

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>{t("notes.title")}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleOpenArchived}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>{t("archived.title")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenSettings}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t("notes.searchPlaceholder")}
            placeholderTextColor="#999"
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchText("")}
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBadges}
        >
          <TouchableOpacity
            style={[
              styles.categoryBadge,
              selectedCategory === "all" && styles.categoryBadgeSelected,
            ]}
            onPress={() => handleCategoryPress("all")}
          >
            <Text
              style={[
                styles.categoryBadgeText,
                selectedCategory === "all" && styles.categoryBadgeTextSelected,
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
                selectedCategory === category.id &&
                  styles.categoryBadgeSelected,
                category.color && { borderColor: category.color },
              ]}
              onPress={() => handleCategoryPress(category.id)}
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
                  selectedCategory === category.id &&
                    styles.categoryBadgeTextSelected,
                ]}
              >
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.categoryBadge,
              selectedCategory === "uncategorized" &&
                styles.categoryBadgeSelected,
            ]}
            onPress={() => handleCategoryPress("uncategorized")}
          >
            <Text
              style={[
                styles.categoryBadgeText,
                selectedCategory === "uncategorized" &&
                  styles.categoryBadgeTextSelected,
              ]}
            >
              {t("categories.uncategorized")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addCategoryBadge}
            onPress={handleOpenCategoryModal}
          >
            <Text style={styles.addCategoryBadgeText}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNote}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isFiltering ? t("notes.noNotesFiltered") : t("notes.noNotes")}
            </Text>
            {!isFiltering && (
              <Text style={styles.emptySubtext}>{t("notes.createFirst")}</Text>
            )}
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateNote}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Category Creation Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseCategoryModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseCategoryModal}>
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {t("categories.newCategory")}
              </Text>
              <TouchableOpacity
                onPress={handleCreateCategory}
                disabled={!newCategoryName.trim()}
              >
                <Text
                  style={[
                    styles.modalActionText,
                    !newCategoryName.trim() && styles.modalActionTextDisabled,
                  ]}
                >
                  {t("categories.create")}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.categoryInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder={t("categories.categoryName")}
              placeholderTextColor="#999"
              autoFocus
            />

            <Text style={styles.colorPickerLabel}>
              {t("categories.selectColor")}
            </Text>
            <View style={styles.colorPicker}>
              {CATEGORY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
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
                !newCategoryName.trim() && styles.addNotesButtonDisabled,
              ]}
              onPress={handleCreateCategoryAndAddNotes}
              disabled={!newCategoryName.trim()}
            >
              <Text
                style={[
                  styles.addNotesButtonText,
                  !newCategoryName.trim() && styles.addNotesButtonTextDisabled,
                ]}
              >
                {t("categories.createAndAddNotes")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Note Selection Modal */}
      <Modal
        visible={showNoteSelectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseNoteSelectionModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              styles.noteSelectionModal,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseNoteSelectionModal}>
                <Text style={styles.modalCancelText}>
                  {t("categories.skip")}
                </Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {t("categories.addNotesToCategory")}
              </Text>
              <TouchableOpacity
                onPress={handleAddNotesToCategory}
                disabled={selectedNoteIds.size === 0}
              >
                <Text
                  style={[
                    styles.modalActionText,
                    selectedNoteIds.size === 0 &&
                      styles.modalActionTextDisabled,
                  ]}
                >
                  {t("categories.addSelected")}{" "}
                  {selectedNoteIds.size > 0 && `(${selectedNoteIds.size})`}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.noteSelectionSubtitle}>
              {t("categories.selectNotes")}
            </Text>

            {allNotesForSelection.length === 0 ? (
              <View style={styles.emptyNoteSelection}>
                <Text style={styles.emptyNoteSelectionText}>
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
                      selectedNoteIds.has(item.id) &&
                        styles.noteSelectionItemSelected,
                    ]}
                    onPress={() => handleToggleNoteSelection(item.id)}
                  >
                    <View
                      style={[
                        styles.noteSelectionCheckbox,
                        selectedNoteIds.has(item.id) &&
                          styles.noteSelectionCheckboxSelected,
                      ]}
                    >
                      {selectedNoteIds.has(item.id) && (
                        <Text style={styles.noteSelectionCheckmark}>✓</Text>
                      )}
                    </View>
                    <View style={styles.noteSelectionTextContent}>
                      <Text style={styles.noteSelectionTitle} numberOfLines={1}>
                        {item.title || t("notes.untitled")}
                      </Text>
                      <Text style={styles.noteSelectionDate}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#000",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
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
    color: "#fff",
  },
  filterContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#000",
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 20,
    color: "#999",
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
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#f5f5f5",
  },
  categoryBadgeSelected: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  categoryBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  categoryBadgeTextSelected: {
    color: "#fff",
  },
  listContent: {
    flexGrow: 1,
  },
  noteItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  noteContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  noteTextContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 13,
    color: "#888",
  },
  archiveAction: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    flex: 1,
  },
  deleteAction: {
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    flex: 1,
  },
  actionText: {
    color: "#fff",
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
    color: "#888",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#aaa",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "300",
    marginTop: -2,
  },
  addCategoryBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addCategoryBadgeText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "300",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
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
    color: "#000",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#007AFF",
  },
  modalActionText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  modalActionTextDisabled: {
    color: "#999",
  },
  categoryInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    marginBottom: 20,
  },
  colorPickerLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
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
    borderColor: "#000",
  },
  addNotesButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  addNotesButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  addNotesButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addNotesButtonTextDisabled: {
    color: "#999",
  },
  noteSelectionModal: {
    maxHeight: "80%",
  },
  noteSelectionSubtitle: {
    fontSize: 14,
    color: "#666",
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
    borderBottomColor: "#e0e0e0",
  },
  noteSelectionItemSelected: {
    backgroundColor: "#f0f8ff",
  },
  noteSelectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noteSelectionCheckboxSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  noteSelectionCheckmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noteSelectionTextContent: {
    flex: 1,
  },
  noteSelectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 2,
  },
  noteSelectionDate: {
    fontSize: 13,
    color: "#888",
  },
  emptyNoteSelection: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyNoteSelectionText: {
    fontSize: 16,
    color: "#888",
  },
});
