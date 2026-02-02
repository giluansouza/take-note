import {
  deleteNote,
  getArchivedNotes,
  Note,
  unarchiveNote,
} from "@/lib/notes.repository";
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
  const { t } = useTranslation();
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
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderLeftActions = () => (
    <View style={styles.unarchiveAction}>
      <Text style={styles.actionText}>{t("notes.unarchive")}</Text>
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.deleteAction}>
      <Text style={styles.actionText}>{t("notes.delete")}</Text>
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
        style={styles.noteItem}
        onPress={() => handleNotePress(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.noteTitle} numberOfLines={1}>
          {item.title || t("notes.untitled")}
        </Text>
        <Text style={styles.noteDate}>{formatDate(item.created_at)}</Text>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{"<"} {t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("archived.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNote}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("archived.noArchived")}</Text>
          </View>
        }
      />
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
    alignItems: "center",
    justifyContent: "space-between",
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
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
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
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
  unarchiveAction: {
    backgroundColor: "#34c759",
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
    fontSize: 16,
    color: "#888",
  },
});
