// Avoid importing react-native-google-mobile-ads at module load time.
// In Expo Go (or any build without the native module), importing it can throw and crash the app.

let cached: any | null | undefined;

export function getGoogleMobileAds(): any | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cached = require("react-native-google-mobile-ads");
  } catch {
    cached = null;
  }
  return cached;
}

