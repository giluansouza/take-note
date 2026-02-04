import { useEffect, useState, useCallback, useRef } from "react";
import { usePremium } from "../premium";
import { adManager } from "./AdManager";
import { getGoogleMobileAds } from "./googleMobileAds";

// Use test IDs in development; if the native module isn't available (Expo Go),
// ads will be disabled and these IDs won't be used.

function areAdsDisabledByEnv(): boolean {
  const v = process.env.EXPO_PUBLIC_DISABLE_ADS;
  return v === "1" || v === "true" || v === "TRUE";
}

export function useBannerAd() {
  const { isPremium } = usePremium();
  const disableAds = areAdsDisabledByEnv();
  const gma = getGoogleMobileAds();
  const testIds = gma?.TestIds;

  return {
    adUnitId: testIds?.ADAPTIVE_BANNER ?? null,
    shouldShow: !disableAds && !isPremium && !!gma,
  };
}

export function useInterstitialAd() {
  const { isPremium } = usePremium();
  const disableAds = areAdsDisabledByEnv();
  const [loaded, setLoaded] = useState(false);
  const interstitialRef = useRef<any | null>(null);
  const editStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (disableAds || isPremium) return;

    const gma = getGoogleMobileAds();
    if (!gma) return;

    const { InterstitialAd, AdEventType, TestIds } = gma;

    try {
      const interstitial = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);
      interstitialRef.current = interstitial;

      const unsubscribeLoaded = interstitial.addAdEventListener(
        AdEventType.LOADED,
        () => setLoaded(true),
      );

      const unsubscribeClosed = interstitial.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          setLoaded(false);
          interstitial.load();
        },
      );

      const unsubscribeError = interstitial.addAdEventListener(
        AdEventType.ERROR,
        (error: unknown) => {
          console.error("Interstitial ad error:", error);
          setLoaded(false);
        },
      );

      interstitial.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeClosed();
        unsubscribeError();
      };
    } catch (error) {
      console.error("Failed to initialize interstitial:", error);
      setLoaded(false);
      interstitialRef.current = null;
      return;
    }
  }, [disableAds, isPremium]);

  const startEditSession = useCallback(() => {
    editStartTimeRef.current = Date.now();
  }, []);

  const showIfEligible = useCallback(async (): Promise<boolean> => {
    if (disableAds || isPremium || !loaded || !interstitialRef.current) {
      return false;
    }

    const editTime = Date.now() - editStartTimeRef.current;
    const canShow = adManager.canShowInterstitial(editTime);

    if (!canShow) {
      return false;
    }

    try {
      await interstitialRef.current.show();
      await adManager.recordInterstitialShown();
      return true;
    } catch (error) {
      console.error("Failed to show interstitial:", error);
      return false;
    }
  }, [disableAds, isPremium, loaded]);

  return {
    loaded,
    startEditSession,
    showIfEligible,
  };
}
