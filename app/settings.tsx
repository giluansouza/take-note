import {
  availableLanguages,
  getCurrentLanguage,
  setLanguage,
} from "@/lib/i18n";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIVACY_POLICY_URL = "https://example.com/privacy";
const TERMS_OF_SERVICE_URL = "https://example.com/terms";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const currentLanguage = getCurrentLanguage();

  const handleBack = () => {
    router.back();
  };

  const handleLanguageSelect = async (languageCode: string) => {
    await setLanguage(languageCode);
    setShowLanguagePicker(false);
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  const handleOpenTermsOfService = () => {
    Linking.openURL(TERMS_OF_SERVICE_URL);
  };

  const handleOpenArchived = () => {
    router.push("/archived");
  };
  const getCurrentLanguageName = () => {
    const lang = availableLanguages.find((l) => l.code === currentLanguage);
    return lang?.nativeName || "English";
  };

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{"<"} {t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowLanguagePicker(true)}
          >
            <Text style={styles.rowLabel}>{t("settings.language")}</Text>
            <Text style={styles.rowValue}>{getCurrentLanguageName()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={handleOpenArchived}>
            <Text style={styles.rowLabel}>{t("archived.title")}</Text>
            <Text style={styles.rowArrow}>{">"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.about")}</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t("settings.version")}</Text>
            <Text style={styles.rowValue}>{appVersion}</Text>
          </View>

          <TouchableOpacity style={styles.row} onPress={handleOpenPrivacyPolicy}>
            <Text style={styles.rowLabel}>{t("settings.privacyPolicy")}</Text>
            <Text style={styles.rowArrow}>{">"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={handleOpenTermsOfService}>
            <Text style={styles.rowLabel}>{t("settings.termsOfService")}</Text>
            <Text style={styles.rowArrow}>{">"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.appDescription}>{t("settings.appDescription")}</Text>
      </ScrollView>

      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLanguagePicker(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t("settings.selectLanguage")}</Text>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.languageOption}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <Text
                  style={[
                    styles.languageText,
                    currentLanguage === lang.code && styles.languageTextSelected,
                  ]}
                >
                  {lang.nativeName}
                </Text>
                {currentLanguage === lang.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowLanguagePicker(false)}
            >
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
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
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  rowLabel: {
    fontSize: 16,
    color: "#000",
  },
  rowValue: {
    fontSize: 16,
    color: "#888",
  },
  rowArrow: {
    fontSize: 16,
    color: "#ccc",
  },
  appDescription: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 320,
    minHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
    textAlign: "center",
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  languageText: {
    fontSize: 16,
    color: "#000",
  },
  languageTextSelected: {
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 16,
    color: "#000",
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    color: "#888",
  },
});
