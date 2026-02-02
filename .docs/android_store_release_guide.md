# Expo App Release Guide — Google Play Store

This guide covers the complete process of preparing an Expo app for production and publishing it on the Google Play Store.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [App Configuration](#2-app-configuration)
3. [EAS Build Setup](#3-eas-build-setup)
4. [Creating a Production Build](#4-creating-a-production-build)
5. [Google Play Console Setup](#5-google-play-console-setup)
6. [Uploading Your App](#6-uploading-your-app)
7. [Store Listing](#7-store-listing)
8. [Release Process](#8-release-process)
9. [Post-Release Updates](#9-post-release-updates)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### Accounts Required

- **Expo Account** (free): https://expo.dev/signup
- **Google Play Developer Account** ($25 one-time fee): https://play.google.com/console/signup

### Tools Required

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login
```

### Assets Required

Before starting, prepare these assets:

| Asset | Dimensions | Format |
|-------|------------|--------|
| App Icon | 1024x1024 px | PNG (no transparency for Android) |
| Feature Graphic | 1024x500 px | PNG or JPG |
| Screenshots (phone) | Min 320px, Max 3840px | PNG or JPG (2-8 images) |
| Screenshots (tablet) | 7" and 10" sizes | PNG or JPG (optional but recommended) |

---

## 2. App Configuration

### 2.1 Update app.json

Configure your app metadata in `app.json`:

```json
{
  "expo": {
    "name": "Tome Nota",
    "slug": "tome-nota",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "tomenota",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon-foreground.png",
        "backgroundImage": "./assets/images/adaptive-icon-background.png",
        "monochromeImage": "./assets/images/adaptive-icon-monochrome.png"
      },
      "package": "com.yourcompany.tomenota",
      "versionCode": 1,
      "permissions": []
    },
    "plugins": [
      "expo-router",
      "expo-sqlite"
    ]
  }
}
```

### 2.2 Key Configuration Fields

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Display name on device | "Tome Nota" |
| `slug` | URL-friendly identifier | "tome-nota" |
| `version` | Semantic version shown to users | "1.0.0" |
| `android.package` | Unique identifier (cannot change after publish) | "com.yourcompany.tomenota" |
| `android.versionCode` | Integer, must increment with each upload | 1, 2, 3... |

### 2.3 Package Name Guidelines

The `android.package` is permanent. Choose carefully:
- Use reverse domain notation: `com.yourcompany.appname`
- Lowercase only
- No hyphens (use underscores or remove)
- Cannot start with a number

---

## 3. EAS Build Setup

### 3.1 Initialize EAS

```bash
# Run from project root
eas build:configure
```

This creates `eas.json` with build profiles:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3.2 Build Profiles Explained

| Profile | Purpose | Output |
|---------|---------|--------|
| `development` | Local testing with dev client | APK |
| `preview` | Internal testing/QA | APK |
| `production` | Store release | AAB (App Bundle) |

### 3.3 Configure Production Build

Update `eas.json` for production:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "remote"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 4. Creating a Production Build

### 4.1 Pre-Build Checklist

- [ ] Update `version` in app.json (e.g., "1.0.0")
- [ ] Increment `android.versionCode` (must be higher than previous)
- [ ] Remove console.log statements
- [ ] Test all features thoroughly
- [ ] Verify all assets are correct size/format
- [ ] Check permissions are minimal and necessary

### 4.2 Build Command

```bash
# Build for Android production
eas build --platform android --profile production
```

### 4.3 Build Process

1. EAS uploads your project to Expo's build servers
2. Build runs in the cloud (typically 10-20 minutes)
3. You receive a URL to download the `.aab` file

### 4.4 First Build — Keystore

On first production build, EAS will ask about signing credentials:

```
? Generate a new Android Keystore? (Y/n)
```

**Choose Yes** — EAS will generate and securely store your keystore.

> ⚠️ **IMPORTANT**: The keystore is required for all future updates. If lost, you cannot update your app. EAS stores it securely, but you can also back it up:
> ```bash
> eas credentials --platform android
> # Select "Download existing keystore"
> ```

### 4.5 Download the Build

After build completes:
- Visit the URL shown in terminal
- Or go to https://expo.dev → Your Project → Builds
- Download the `.aab` file

---

## 5. Google Play Console Setup

### 5.1 Create Developer Account

1. Go to https://play.google.com/console/signup
2. Pay $25 registration fee
3. Complete identity verification (may take 48 hours)

### 5.2 Create New App

1. In Play Console, click **"Create app"**
2. Fill in:
   - App name
   - Default language
   - App or Game
   - Free or Paid
3. Accept policies and create

### 5.3 App Content Setup

Before you can release, complete these sections in **Policy → App content**:

| Section | What to Provide |
|---------|-----------------|
| Privacy policy | URL to your privacy policy |
| Ads | Declare if app contains ads |
| App access | How testers can access features (if login required) |
| Content ratings | Complete questionnaire |
| Target audience | Age groups your app targets |
| News apps | Declare if it's a news app |
| Data safety | Declare data collection practices |
| Government apps | Declare if government affiliated |
| Financial features | Declare if has financial features |

### 5.4 Store Listing Setup

Navigate to **Grow → Store presence → Main store listing**:

**Required:**
- App name (max 30 characters)
- Short description (max 80 characters)
- Full description (max 4000 characters)
- App icon (512x512, uploaded separately here)
- Feature graphic (1024x500)
- Phone screenshots (2-8 images)

**Recommended:**
- Tablet screenshots
- Video (YouTube URL)

---

## 6. Uploading Your App

### 6.1 Manual Upload

1. Go to **Release → Production** (or Testing → Internal testing)
2. Click **"Create new release"**
3. Upload your `.aab` file
4. Add release notes
5. Save

### 6.2 Automated Upload with EAS Submit

Set up a Google Service Account for automated uploads:

#### Step 1: Create Service Account

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Select or create a project
3. Enable **Google Play Android Developer API**
4. Go to **IAM & Admin → Service Accounts**
5. Create service account with name like "eas-submit"
6. Grant no roles (Play Console handles permissions)
7. Create JSON key and download

#### Step 2: Link to Play Console

1. In Play Console, go to **Setup → API access**
2. Link your Google Cloud project
3. Under Service Accounts, find your account
4. Click **"Manage Play Console permissions"**
5. Grant **"Release to production"** permission
6. Apply to your app

#### Step 3: Configure EAS

Save the JSON key file securely (add to `.gitignore`!):

```bash
# .gitignore
google-service-account.json
```

Update `eas.json`:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

#### Step 4: Submit

```bash
# Build and submit in one command
eas build --platform android --profile production --auto-submit

# Or submit an existing build
eas submit --platform android --latest
```

---

## 7. Store Listing

### 7.1 Writing Effective Descriptions

**Short Description (80 chars):**
```
Quick, minimal note-taking. Organize with sections, lists & checklists.
```

**Full Description Structure:**
```
[Hook - What is it?]
Tome Nota is a fast, minimal notes app designed for instant capture.

[Key Features]
✓ Organize notes with sections
✓ Create checklists with satisfying haptic feedback
✓ Bullet lists for quick ideas
✓ Works completely offline
✓ No account required

[How it's different]
Unlike bloated note apps, Tome Nota focuses on speed and simplicity. Open the app and start writing in under a second.

[Call to action]
Download now and experience distraction-free note-taking.
```

### 7.2 Screenshots Tips

- Show actual app screens (not mockups for main screenshots)
- First 2 screenshots are most important (visible before expand)
- Add device frames for polish
- Include text overlays highlighting features
- Show the app in action, not empty states

### 7.3 Feature Graphic

- 1024x500 pixels
- This appears at the top of your listing
- Include app name/logo and key visual
- Keep text minimal and readable

---

## 8. Release Process

### 8.1 Testing Tracks

Google Play has multiple release tracks:

| Track | Audience | Purpose |
|-------|----------|---------|
| Internal testing | Up to 100 testers | Quick iteration, immediate availability |
| Closed testing | Invite-only groups | Beta testing with specific users |
| Open testing | Anyone can join | Public beta |
| Production | Everyone | Full release |

### 8.2 Recommended Release Flow

```
Internal Testing → Closed Testing → Production
```

1. **Internal Testing** (optional but recommended)
   - Upload build
   - Test yourself and with small team
   - No review required, available in minutes

2. **Closed Testing** (recommended)
   - Create tester group
   - Get feedback from real users
   - Fix issues before public release

3. **Production**
   - Submit for review
   - Review takes typically 1-3 days (can be longer for new apps)
   - App goes live after approval

### 8.3 Submitting for Review

1. Go to **Release → Production**
2. Click **"Create new release"**
3. Upload `.aab` or select from library
4. Add release notes (user-facing changelog)
5. Click **"Review release"**
6. Review warnings/errors
7. Click **"Start rollout to Production"**

### 8.4 Staged Rollout

You can release to a percentage of users:

- Start with 10-20%
- Monitor for crashes/issues
- Gradually increase to 100%
- Halt rollout if problems found

---

## 9. Post-Release Updates

### 9.1 Updating Your App

1. Update `version` in app.json (e.g., "1.0.0" → "1.1.0")
2. Increment `versionCode` (e.g., 1 → 2)
3. Build new version: `eas build --platform android --profile production`
4. Upload to Play Console or use `eas submit`

### 9.2 Version Numbering

Follow semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

`versionCode` must always increment (never decrease or repeat).

### 9.3 OTA Updates with EAS Update

For JavaScript-only changes, use over-the-air updates:

```bash
# Install
npx expo install expo-updates

# Configure in app.json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

```bash
# Push an update (no new build required)
eas update --branch production --message "Fixed typo"
```

> ⚠️ OTA updates can only change JavaScript/assets. Native code changes require a new build.

---

## 10. Troubleshooting

### Common Build Errors

**"SDK version not supported"**
```bash
# Update Expo SDK
npx expo install expo@latest
```

**"Keystore password incorrect"**
```bash
# Re-download keystore
eas credentials --platform android
# Select "Clear credentials" then build again
```

**Build times out**
- Check Expo status: https://status.expo.dev
- Try building during off-peak hours

### Common Upload Errors

**"Version code already exists"**
- Increment `android.versionCode` in app.json

**"Package name mismatch"**
- Your `android.package` must match exactly what's in Play Console
- This cannot be changed after first upload

**"Deobfuscation file not found" (warning)**
- This is normal for Expo apps
- You can safely ignore this warning

### Review Rejections

Common reasons and fixes:

| Rejection Reason | Fix |
|-----------------|-----|
| Missing privacy policy | Add privacy policy URL to store listing AND in-app |
| Broken functionality | Test all features before submission |
| Misleading metadata | Ensure screenshots and description match actual app |
| Insufficient content | Add more features or content before submitting |

---

## Quick Reference Commands

```bash
# Login to Expo
eas login

# Configure EAS for project
eas build:configure

# Build for Android production
eas build --platform android --profile production

# Build and auto-submit
eas build --platform android --profile production --auto-submit

# Submit existing build
eas submit --platform android --latest

# Check build status
eas build:list

# Download credentials
eas credentials --platform android

# Push OTA update
eas update --branch production --message "Update message"
```

---

## Checklist Summary

### Before First Release
- [ ] Expo account created
- [ ] Google Play Developer account ($25)
- [ ] App icon 1024x1024
- [ ] Adaptive icons configured
- [ ] Package name decided (permanent!)
- [ ] Privacy policy URL ready
- [ ] EAS configured (`eas build:configure`)

### For Each Release
- [ ] Version updated in app.json
- [ ] versionCode incremented
- [ ] Build created (`eas build`)
- [ ] Tested on real device
- [ ] Release notes written
- [ ] Screenshots updated (if UI changed)

### After Release
- [ ] Monitor crash reports (Play Console → Quality → Android Vitals)
- [ ] Respond to user reviews
- [ ] Plan next update
