# Monetization Model — Tome Nota

## Overview

### About Tome Nota

Tome Nota is a **minimal, offline-first notes application** built with React Native and Expo. Designed for speed and simplicity, it allows users to capture thoughts instantly without friction.

**Core Features:**
- Notes organized into **sections** (with optional titles and subtitles)
- Multiple content block types: **text**, **checklists**, and **lists**
- **Categories** and **tags** for organization
- **Archive** and **delete** with swipe gestures
- **Autosave** — no save button needed
- Works **100% offline** with local SQLite storage

**Design Philosophy:**
> Build the smallest thing that you would actually use every day.

Speed, clarity, and reliability over features. The app opens in under 1 second with no splash screens or loading spinners for local data.

---

### Monetization Model

Tome Nota uses a **freemium model** with two tiers:
- **Free**: Full functionality with ads
- **Premium**: Ad-free experience with additional features

---

## Tier Comparison

| Feature | Free | Premium |
|---------|------|---------|
| Create unlimited notes | ✓ | ✓ |
| Sections, text, lists, checklists | ✓ | ✓ |
| Categories & tags | ✓ | ✓ |
| Archive & delete | ✓ | ✓ |
| Offline access | ✓ | ✓ |
| **Ads** | Yes | **No** |
| Image attachments | Limited (5/note) | **Unlimited** |
| Cloud sync | — | ✓ |
| Location blocks | — | ✓ |
| Album view | — | ✓ |
| Custom themes | — | ✓ |
| Priority support | — | ✓ |

---

## Pricing

### Premium Subscription

| Plan | Price | Savings |
|------|-------|---------|
| Monthly | $2.99/month | — |
| Annual | $19.99/year | 44% (~$1.67/month) |

### Regional Pricing

Adjust prices for different markets:

| Region | Monthly | Annual |
|--------|---------|--------|
| US, Canada, EU | $2.99 | $19.99 |
| Brazil, India, Mexico | $1.49 | $9.99 |
| Other emerging markets | $0.99 | $6.99 |

> Use Google Play Console's regional pricing tools to set appropriate prices per country.

---

## Free Tier — Ad Strategy

### Ad Placement Principles

1. **Non-intrusive**: Ads should not interrupt core note-taking flow
2. **Predictable**: Users know where ads appear
3. **Respectful**: No ads during active writing/editing
4. **Limited frequency**: Avoid ad fatigue

### Ad Placements

#### 1. Banner Ad — Notes List (Primary)

**Location**: Bottom of notes list screen, above FAB
**Type**: Adaptive banner
**Visibility**: Always visible on list screen
**Size**: 320x50 (standard) or adaptive

```
┌─────────────────────────┐
│ Header: Take Note       │
├─────────────────────────┤
│ Note 1                  │
│ Note 2                  │
│ Note 3                  │
│ ...                     │
│                         │
├─────────────────────────┤
│ ▓▓▓▓ BANNER AD ▓▓▓▓▓▓▓ │  ← Fixed at bottom
└─────────────────────────┘
                      [+] FAB
```

#### 2. Interstitial Ad — Note Close (Secondary)

**Trigger**: When leaving a note after editing for 30+ seconds
**Frequency**: Maximum once per 10 minutes
**Skip**: Always skippable after 5 seconds
**Exclusions**:
- Never show on first app session
- Never show if user opened note < 30 seconds ago
- Never show more than 3x per day

#### 3. Native Ad — Archive Section (Optional)

**Location**: If implementing an "Archived Notes" view, show native ad card mixed with archived notes
**Frequency**: One ad per 10 archived notes
**Style**: Matches note card appearance with "Ad" label

### Ad-Free Moments

Never show ads during:
- Active text input (keyboard open)
- First 3 app opens (onboarding grace period)
- Immediately after purchase prompt dismissed
- Within 5 seconds of app open

---

## Ad Implementation

### Recommended SDK

**Google AdMob** (via `react-native-google-mobile-ads`)

```bash
npm install react-native-google-mobile-ads
```

### Configuration

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-xxxxxxxx~xxxxxxxx",
          "iosAppId": "ca-app-pub-xxxxxxxx~xxxxxxxx"
        }
      ]
    ]
  }
}
```

### Ad Unit IDs Structure

| Placement | Format | Test ID (Android) |
|-----------|--------|-------------------|
| List banner | Banner | ca-app-pub-3940256099942544/6300978111 |
| Note close | Interstitial | ca-app-pub-3940256099942544/1033173712 |
| Archive native | Native | ca-app-pub-3940256099942544/2247696110 |

> Always use test IDs during development. Real IDs only in production.

### Ad Loading Strategy

```typescript
// Pseudocode for ad management
class AdManager {
  private interstitialLastShown: Date | null = null;
  private interstitialCount: number = 0;
  private readonly MAX_INTERSTITIALS_PER_DAY = 3;
  private readonly MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  canShowInterstitial(): boolean {
    if (this.interstitialCount >= this.MAX_INTERSTITIALS_PER_DAY) {
      return false;
    }
    if (this.interstitialLastShown) {
      const elapsed = Date.now() - this.interstitialLastShown.getTime();
      if (elapsed < this.MIN_INTERVAL_MS) {
        return false;
      }
    }
    return true;
  }

  onInterstitialShown(): void {
    this.interstitialLastShown = new Date();
    this.interstitialCount++;
  }

  resetDailyCount(): void {
    this.interstitialCount = 0;
  }
}
```

---

## Premium Subscription Implementation

### In-App Purchases Setup

**Library**: `react-native-purchases` (RevenueCat)

RevenueCat simplifies subscription management across platforms:
- Handles receipt validation
- Manages subscription status
- Provides analytics
- Supports promotional offers

```bash
npm install react-native-purchases
```

### Product IDs

| Product | ID | Type |
|---------|-----|------|
| Monthly | `tomenota_premium_monthly` | Auto-renewable subscription |
| Annual | `tomenota_premium_annual` | Auto-renewable subscription |

### Subscription Entitlements

```typescript
// Premium feature check
interface UserEntitlements {
  isPremium: boolean;
  expirationDate: Date | null;
  willRenew: boolean;
}

async function checkPremiumStatus(): Promise<UserEntitlements> {
  const customerInfo = await Purchases.getCustomerInfo();
  const entitlement = customerInfo.entitlements.active['premium'];

  return {
    isPremium: !!entitlement,
    expirationDate: entitlement?.expirationDate
      ? new Date(entitlement.expirationDate)
      : null,
    willRenew: entitlement?.willRenew ?? false,
  };
}
```

### Premium Context Provider

```typescript
// contexts/PremiumContext.tsx
interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  purchase: (productId: string) => Promise<void>;
  restore: () => Promise<void>;
}

// Wrap app with this provider
// Check isPremium before showing ads or gating features
```

---

## Paywall Design

### When to Show Paywall

1. **Soft triggers** (dismissible):
   - After 7 days of use
   - When trying to add 6th image to a note
   - When tapping locked feature (location, album view)
   - After closing 3rd interstitial ad

2. **Settings access**:
   - Always accessible via Settings → Premium

### Paywall Screen Content

```
┌─────────────────────────────────┐
│            ⭐ Premium           │
│                                 │
│  Upgrade for the best           │
│  note-taking experience         │
│                                 │
│  ✓ No ads, ever                │
│  ✓ Unlimited images            │
│  ✓ Cloud sync across devices   │
│  ✓ Location blocks             │
│  ✓ Album view                  │
│  ✓ Custom themes               │
│                                 │
│  ┌───────────────────────────┐ │
│  │   $19.99/year             │ │
│  │   BEST VALUE - Save 44%   │ │
│  │   Just $1.67/month        │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │   $2.99/month             │ │
│  └───────────────────────────┘ │
│                                 │
│  [ Restore Purchase ]          │
│                                 │
│  Terms • Privacy • Cancel      │
└─────────────────────────────────┘
```

### Paywall Best Practices

- Highlight annual plan savings prominently
- Show annual price as monthly equivalent ($1.67/mo)
- Always include "Restore Purchase" button
- Link to terms and privacy policy
- Allow dismissal (no forced purchases)
- A/B test different messaging

---

## Revenue Projections

### Assumptions

- 10,000 monthly active users
- 3% premium conversion rate
- 70/30 split monthly/annual subscribers
- $3 eCPM for banner ads
- $10 eCPM for interstitials

### Monthly Revenue Estimate

**Subscription Revenue:**
```
Premium users: 10,000 × 3% = 300 users
Monthly subscribers: 300 × 70% = 210 × $2.99 = $628
Annual subscribers: 300 × 30% = 90 × ($19.99/12) = $150
Gross subscription: $778/month
After store fee (15%): $661/month
```

**Ad Revenue (Free Users):**
```
Free users: 9,700
Banner impressions: 9,700 × 5 sessions × 3 views = 145,500
Banner revenue: 145,500 × ($3/1000) = $437

Interstitial impressions: 9,700 × 1.5/day × 30 = 436,500
Interstitial revenue: 436,500 × ($10/1000) = $4,365
Total ad revenue: ~$4,800/month
```

**Total Estimated Revenue: ~$5,400/month**

> These are rough estimates. Actual results vary significantly based on user engagement, geography, and ad market conditions.

---

## Implementation Checklist

### Phase 1: Ads (Free Tier)
- [ ] Set up AdMob account
- [ ] Create ad units (banner, interstitial)
- [ ] Install `react-native-google-mobile-ads`
- [ ] Implement banner on notes list
- [ ] Implement interstitial with frequency capping
- [ ] Add ad consent flow (GDPR/ATT)
- [ ] Test with test ad IDs
- [ ] Switch to production IDs for release

### Phase 2: Subscriptions (Premium)
- [ ] Set up RevenueCat account
- [ ] Create products in Google Play Console
- [ ] Configure products in RevenueCat
- [ ] Install `react-native-purchases`
- [ ] Implement PremiumContext provider
- [ ] Build paywall screen
- [ ] Gate premium features
- [ ] Hide ads for premium users
- [ ] Implement restore purchases
- [ ] Test purchase flow with sandbox

### Phase 3: Optimization
- [ ] Add analytics for conversion funnel
- [ ] A/B test paywall designs
- [ ] Implement promotional offers
- [ ] Add subscription management in settings
- [ ] Monitor and optimize ad placements

---

## Legal Requirements

### Required Disclosures

1. **Privacy Policy** must include:
   - Ad networks used and their data practices
   - Subscription auto-renewal terms
   - Data collection for personalized ads

2. **Terms of Service** must include:
   - Subscription pricing and billing terms
   - Cancellation policy
   - Refund policy

3. **In-App Disclosures**:
   - "Subscriptions auto-renew unless cancelled"
   - Price and billing frequency before purchase
   - Link to manage subscriptions

### Consent Requirements

- **GDPR (EU)**: Show ad consent dialog before loading ads
- **ATT (iOS)**: Request App Tracking Transparency permission
- **CCPA (California)**: Provide "Do Not Sell" option

Use Google's UMP SDK for consent management:
```bash
npm install react-native-google-mobile-ads
# UMP is included
```

---

## Future Considerations

### Potential Additional Revenue Streams

1. **One-time purchases**:
   - Icon packs
   - Theme packs
   - Export to PDF

2. **Higher tier subscription**:
   - Team/Family plan
   - Increased cloud storage
   - API access

3. **Partnerships**:
   - Affiliate links for productivity tools
   - Sponsored templates

### Pricing Experiments

- Test $3.99 vs $2.99 monthly
- Test $24.99 vs $19.99 annual
- Test free trial (7 days) vs no trial
- Test lifetime purchase option
