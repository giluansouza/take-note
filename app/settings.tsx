import {
  availableLanguages,
  getCurrentLanguage,
  setLanguage,
} from "@/lib/i18n";
import { useTheme, ThemeMode } from "@/lib/theme";
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

const PRIVACY_POLICY_URL =
  "https://giluansouza.github.io/take-note/privacy-policy.html";
const TERMS_OF_SERVICE_URL =
  "https://giluansouza.github.io/take-note/terms-and-conditions.html";

const THEME_OPTIONS: { mode: ThemeMode; labelKey: string }[] = [
  { mode: "system", labelKey: "settings.themeSystem" },
  { mode: "light", labelKey: "settings.themeLight" },
  { mode: "dark", labelKey: "settings.themeDark" },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { mode, setMode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const currentLanguage = getCurrentLanguage();

  const handleBack = () => {
    router.back();
  };

  const handleLanguageSelect = async (languageCode: string) => {
    await setLanguage(languageCode);
    setShowLanguagePicker(false);
  };

  const handleThemeSelect = async (newMode: ThemeMode) => {
    await setMode(newMode);
    setShowThemePicker(false);
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

  const getCurrentThemeName = () => {
    const option = THEME_OPTIONS.find((o) => o.mode === mode);
    return option ? t(option.labelKey) : t("settings.themeSystem");
  };

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.headerBackground }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.headerText }]}>
            {"<"} {t("common.back")}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t("settings.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => setShowLanguagePicker(true)}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t("settings.language")}</Text>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>{getCurrentLanguageName()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => setShowThemePicker(true)}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t("settings.theme")}</Text>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>{getCurrentThemeName()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={handleOpenArchived}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t("archived.title")}</Text>
            <Text style={[styles.rowArrow, { color: colors.placeholder }]}>{">"}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t("settings.about")}</Text>

          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t("settings.version")}</Text>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>{appVersion}</Text>
          </View>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={handleOpenPrivacyPolicy}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t("settings.privacyPolicy")}</Text>
            <Text style={[styles.rowArrow, { color: colors.placeholder }]}>{">"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={handleOpenTermsOfService}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t("settings.termsOfService")}</Text>
            <Text style={[styles.rowArrow, { color: colors.placeholder }]}>{">"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.appDescription, { color: colors.textMuted }]}>
          {t("settings.appDescription")}
        </Text>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
          onPress={() => setShowLanguagePicker(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.modalBackground }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("settings.selectLanguage")}
            </Text>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.languageOption, { borderBottomColor: colors.border }]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <Text
                  style={[
                    styles.languageText,
                    { color: colors.text },
                    currentLanguage === lang.code &&
                      styles.languageTextSelected,
                  ]}
                >
                  {lang.nativeName}
                </Text>
                {currentLanguage === lang.code && (
                  <Text style={[styles.checkmark, { color: colors.text }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowLanguagePicker(false)}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
          onPress={() => setShowThemePicker(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.modalBackground }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("settings.selectTheme")}
            </Text>
            {THEME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.mode}
                style={[styles.languageOption, { borderBottomColor: colors.border }]}
                onPress={() => handleThemeSelect(option.mode)}
              >
                <Text
                  style={[
                    styles.languageText,
                    { color: colors.text },
                    mode === option.mode && styles.languageTextSelected,
                  ]}
                >
                  {t(option.labelKey)}
                </Text>
                {mode === option.mode && (
                  <Text style={[styles.checkmark, { color: colors.text }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowThemePicker(false)}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>{t("common.cancel")}</Text>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
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
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
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
  },
  rowLabel: {
    fontSize: 16,
  },
  rowValue: {
    fontSize: 16,
  },
  rowArrow: {
    fontSize: 16,
  },
  appDescription: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 320,
    minHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  languageText: {
    fontSize: 16,
  },
  languageTextSelected: {
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
  },
});
