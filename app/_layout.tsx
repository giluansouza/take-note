import "@/lib/i18n";
import { adManager } from "@/lib/ads";
import { runMigrations } from "@/lib/migrations";
import { PremiumProvider } from "@/lib/premium";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

SystemUI.setBackgroundColorAsync("#000");

function AppContent() {
  const { colors } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([
      runMigrations(),
      adManager.initialize(),
    ])
      .then(() => setIsReady(true))
      .catch(console.error);
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="note/[id]" />
        <Stack.Screen name="archived" />
        <Stack.Screen name="settings" />
      </Stack>
      {/* Header is dark in both themes; keep status bar content light for legibility. */}
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PremiumProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </PremiumProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
