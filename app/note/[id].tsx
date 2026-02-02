import { Section } from "@/components/Section";
import {
  Category,
  getAllCategories,
} from "@/lib/categories.repository";
import {
  deleteNote,
  getNoteById,
  Note,
  setNoteCategory,
  updateNoteTitle,
} from "@/lib/notes.repository";
import {
  createSection,
  getSectionsByNoteId,
  Section as SectionType,
} from "@/lib/sections.repository";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NoteDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = parseInt(id, 10);
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<SectionType[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadNote();
      return () => {
        if (titleTimeoutRef.current) {
          clearTimeout(titleTimeoutRef.current);
        }
      };
    }, [noteId]),
  );

  const loadNote = async () => {
    try {
      const [note, allCategories, noteSections] = await Promise.all([
        getNoteById(noteId),
        getAllCategories(),
        getSectionsByNoteId(noteId),
      ]);
      if (note) {
        setTitle(note.title);
        setCategoryId(note.category_id);
      }
      setCategories(allCategories);
      setSections(noteSections);
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

  const handleAddSection = async () => {
    try {
      const position = sections.length;
      await createSection(noteId, position);
      await loadNote();
    } catch (error) {
      console.error("Failed to add section:", error);
    }
  };

  const handleSectionUpdate = () => {
    loadNote();
  };

  const handleBack = () => {
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
    Alert.alert(
      t("notes.deleteNoteTitle"),
      t("notes.deleteNoteMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
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
      ],
    );
  };

  const untitledText = t("notes.untitled");

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>{"<"} {t("common.back")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteNote}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>{t("notes.delete")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder={t("notes.notePlaceholder")}
            placeholderTextColor="#999"
            autoFocus={title === untitledText}
            selectTextOnFocus={title === untitledText}
          />

          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryPicker(true)}
          >
            {getCurrentCategory()?.color && (
              <View
                style={[
                  styles.categorySelectorDot,
                  { backgroundColor: getCurrentCategory()?.color },
                ]}
              />
            )}
            <Text style={styles.categorySelectorText}>
              {getCurrentCategory()?.title || t("categories.uncategorized")}
            </Text>
            <Text style={styles.categorySelectorArrow}>›</Text>
          </TouchableOpacity>

          {sections.map((section) => (
            <Section
              key={section.id}
              section={section}
              onUpdate={handleSectionUpdate}
            />
          ))}

          <TouchableOpacity
            style={styles.addSectionButton}
            onPress={handleAddSection}
            activeOpacity={0.7}
          >
            <Text style={styles.addSectionText}>{t("notes.addSection")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t("categories.category")}</Text>
              <View style={{ width: 60 }} />
            </View>

            <FlatList
              data={[{ id: null, title: t("categories.uncategorized"), color: null }, ...categories]}
              keyExtractor={(item) => (item.id ?? "uncategorized").toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    categoryId === item.id && styles.categoryOptionSelected,
                  ]}
                  onPress={() => handleSelectCategory(item.id)}
                >
                  {item.color && (
                    <View
                      style={[styles.categoryOptionDot, { backgroundColor: item.color }]}
                    />
                  )}
                  <Text
                    style={[
                      styles.categoryOptionText,
                      categoryId === item.id && styles.categoryOptionTextSelected,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {categoryId === item.id && (
                    <Text style={styles.categoryOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#000",
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: 16,
    color: "#fff",
  },
  deleteButton: {
    paddingVertical: 4,
    paddingLeft: 12,
  },
  deleteText: {
    fontSize: 16,
    color: "#ff3b30",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 24,
    padding: 0,
  },
  addSectionButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    borderRadius: 8,
    marginTop: 16,
  },
  addSectionText: {
    fontSize: 15,
    color: "#666",
  },
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 24,
  },
  categorySelectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  categorySelectorArrow: {
    fontSize: 18,
    color: "#999",
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
    maxHeight: "60%",
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
    color: "#000",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#007AFF",
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  categoryOptionSelected: {
    backgroundColor: "#f0f8ff",
  },
  categoryOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  categoryOptionTextSelected: {
    fontWeight: "600",
  },
  categoryOptionCheck: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});
