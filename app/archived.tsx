import {
  deleteNote,
  getArchivedNotes,
  Note,
  unarchiveNote,
} from "@/lib/notes.repository";
import { useTheme } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ArchivedScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const swipeableRefs = useRef<Map<number, Swipeable>>(new Map());

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, []),
  );

  const loadNotes = async () => {
    try {
      const archivedNotes = await getArchivedNotes();
      setNotes(archivedNotes);
    } catch (error) {
      console.error("Failed to load archived notes:", error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleUnarchive = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await unarchiveNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (error) {
      console.error("Failed to unarchive note:", error);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      t("archived.deleteConfirmTitle"),
      t("archived.deleteConfirmMessage"),
      [
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
      ],
    );
  };

  const handleNotePress = (id: number) => {
    router.push(`/note/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderLeftActions = () => (
    <View style={[styles.unarchiveAction, { backgroundColor: colors.success }]}>
      <Text style={[styles.actionText, { color: colors.textInverse }]}>{t("notes.unarchive")}</Text>
    </View>
  );

  const renderRightActions = () => (
    <View style={[styles.deleteAction, { backgroundColor: colors.danger }]}>
      <Text style={[styles.actionText, { color: colors.textInverse }]}>{t("notes.delete")}</Text>
    </View>
  );

  const renderNote = ({ item }: { item: Note }) => (
    <Swipeable
      ref={(ref) => {
        if (ref) swipeableRefs.current.set(item.id, ref);
      }}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        if (direction === "left") {
          handleUnarchive(item.id);
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
        <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title || t("notes.untitled")}
        </Text>
        <Text style={[styles.noteDate, { color: colors.textMuted }]}>{formatDate(item.created_at)}</Text>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.headerBackground }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.headerText} />
          <Text style={[styles.backText, { color: colors.headerText }]}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t("archived.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNote}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t("archived.noArchived")}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingRight: 12,
    flexShrink: 0,
  },
  backText: {
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  placeholder: {
    width: 60,
  },
  listContent: {
    flexGrow: 1,
  },
  noteItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 13,
  },
  unarchiveAction: {
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
    fontSize: 16,
  },
});
