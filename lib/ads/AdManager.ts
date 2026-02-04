import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ad_manager';
const MAX_INTERSTITIALS_PER_DAY = 3;
const MIN_TIME_BETWEEN_ADS_MS = 10 * 60 * 1000; // 10 minutes
const MIN_EDIT_TIME_MS = 30 * 1000; // 30 seconds

interface AdManagerState {
  lastInterstitialTime: number;
  interstitialsToday: number;
  todayDate: string;
}

class AdManager {
  private state: AdManagerState = {
    lastInterstitialTime: 0,
    interstitialsToday: 0,
    todayDate: '',
  };
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      }
      this.resetIfNewDay();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize AdManager:', error);
      this.initialized = true;
    }
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private resetIfNewDay(): void {
    const today = this.getTodayString();
    if (this.state.todayDate !== today) {
      this.state.todayDate = today;
      this.state.interstitialsToday = 0;
    }
  }

  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save AdManager state:', error);
    }
  }

  canShowInterstitial(editTimeMs: number): boolean {
    if (!this.initialized) return false;

    this.resetIfNewDay();

    // Check minimum edit time
    if (editTimeMs < MIN_EDIT_TIME_MS) {
      return false;
    }

    // Check daily limit
    if (this.state.interstitialsToday >= MAX_INTERSTITIALS_PER_DAY) {
      return false;
    }

    // Check time since last ad
    const now = Date.now();
    if (now - this.state.lastInterstitialTime < MIN_TIME_BETWEEN_ADS_MS) {
      return false;
    }

    return true;
  }

  async recordInterstitialShown(): Promise<void> {
    this.state.lastInterstitialTime = Date.now();
    this.state.interstitialsToday++;
    await this.saveState();
  }

  getMinEditTimeMs(): number {
    return MIN_EDIT_TIME_MS;
  }
}

export const adManager = new AdManager();
