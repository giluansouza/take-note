import { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useBannerAd } from "@/lib/ads";
import { getGoogleMobileAds } from "@/lib/ads/googleMobileAds";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function BannerAdView() {
  const { adUnitId, shouldShow } = useBannerAd();
  const [hasError, setHasError] = useState(false);
  const insets = useSafeAreaInsets();

  const gma = useMemo(() => getGoogleMobileAds(), []);
  const BannerAd = gma?.BannerAd as any;
  const BannerAdSize = gma?.BannerAdSize as any;

  if (!shouldShow || hasError || !gma || !BannerAd || !BannerAdSize || !adUnitId) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(error) => {
          console.error("Banner ad failed to load:", error);
          setHasError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
  },
});
