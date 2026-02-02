# Internationalization (i18n) Guide — Tome Nota

## Overview

This guide covers implementing multi-language support in Tome Nota using **i18next**, the most popular internationalization framework for React/React Native.

**Supported Languages:**
- English (en) — Default
- Brazilian Portuguese (pt-BR)

---

## Table of Contents

1. [Setup](#1-setup)
2. [Project Structure](#2-project-structure)
3. [Configuration](#3-configuration)
4. [Translation Files](#4-translation-files)
5. [Using Translations](#5-using-translations)
6. [Language Detection](#6-language-detection)
7. [Language Switching](#7-language-switching)
8. [Advanced Features](#8-advanced-features)
9. [Best Practices](#9-best-practices)
10. [Testing](#10-testing)

---

## 1. Setup

### Install Dependencies

```bash
npm install i18next react-i18next expo-localization
```

| Package | Purpose |
|---------|---------|
| `i18next` | Core internationalization framework |
| `react-i18next` | React bindings for i18next |
| `expo-localization` | Detect device language/locale |

---

## 2. Project Structure

```
lib/
  i18n/
    index.ts              # i18n configuration
    resources.ts          # Combines all translations
    locales/
      en.ts               # English translations
      pt-BR.ts            # Brazilian Portuguese translations
```

---

## 3. Configuration

### lib/i18n/index.ts

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resources } from './resources';

const LANGUAGE_KEY = '@app_language';

// Language detector plugin
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // Check for saved language preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // Fall back to device language
      const deviceLanguage = Localization.getLocales()[0]?.languageTag;

      // Map device language to supported language
      if (deviceLanguage?.startsWith('pt')) {
        callback('pt-BR');
      } else {
        callback('en');
      }
    } catch {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // Ignore storage errors
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'notes', 'settings', 'premium'],

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

export default i18n;

// Helper to change language
export async function setLanguage(language: string): Promise<void> {
  await i18n.changeLanguage(language);
}

// Get current language
export function getCurrentLanguage(): string {
  return i18n.language;
}

// Get available languages
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  ];
}
```

### lib/i18n/resources.ts

```typescript
import en from './locales/en';
import ptBR from './locales/pt-BR';

export const resources = {
  en,
  'pt-BR': ptBR,
};
```

---

## 4. Translation Files

### Namespace Organization

Split translations into logical namespaces:

| Namespace | Content |
|-----------|---------|
| `common` | Shared UI elements (buttons, labels, errors) |
| `notes` | Notes list, note detail, sections, blocks |
| `settings` | Settings screen |
| `premium` | Premium features, paywall, subscription |

### lib/i18n/locales/en.ts

```typescript
export default {
  common: {
    // Actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    back: 'Back',
    close: 'Close',
    create: 'Create',
    add: 'Add',
    remove: 'Remove',
    search: 'Search',

    // States
    loading: 'Loading...',
    error: 'Something went wrong',
    empty: 'Nothing here',
    retry: 'Try again',

    // Confirmations
    areYouSure: 'Are you sure?',
    yes: 'Yes',
    no: 'No',

    // Time
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: '{{count}} day ago',
    daysAgo_plural: '{{count}} days ago',
  },

  notes: {
    // List screen
    title: 'Take Note',
    noNotes: 'No notes yet',
    createFirst: 'Tap + to create your first note',

    // Actions
    newNote: 'New Note',
    archive: 'Archive',
    unarchive: 'Unarchive',
    deleteNote: 'Delete Note',
    deleteConfirm: 'Delete this note? This cannot be undone.',

    // Note detail
    untitled: 'Untitled',
    notePlaceholder: 'Note title',

    // Sections
    addSection: 'Add Section',
    sectionTitle: 'Section title',
    sectionSubtitle: 'Subtitle (optional)',
    deleteSection: 'Delete Section',

    // Blocks
    addBlock: 'Add Block',
    textBlock: 'Text',
    checklistBlock: 'Checklist',
    listBlock: 'List',
    imageBlock: 'Image',
    locationBlock: 'Location',

    // Block content
    enterText: 'Enter text...',
    addItem: 'Add item',
    item: 'Item',

    // Categories & Tags
    category: 'Category',
    noCategory: 'No category',
    selectCategory: 'Select category',
    createCategory: 'Create "{{name}}"',

    tags: 'Tags',
    noTags: 'No tags',
    addTag: 'Add Tag',
    createTag: 'Create "{{name}}"',

    // Views
    listView: 'List',
    albumView: 'Album',

    // Archive
    archived: 'Archived',
    archivedNotes: 'Archived Notes',
    noArchivedNotes: 'No archived notes',
  },

  settings: {
    title: 'Settings',

    // Sections
    account: 'Account',
    preferences: 'Preferences',
    about: 'About',

    // Account
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signOutConfirm: 'Are you sure you want to sign out?',
    email: 'Email',
    notSignedIn: 'Not signed in',

    // Preferences
    language: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',

    // Premium
    premium: 'Premium',
    upgradeToPremium: 'Upgrade to Premium',
    premiumActive: 'Premium Active',
    restorePurchases: 'Restore Purchases',
    manageSubscription: 'Manage Subscription',

    // About
    version: 'Version',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    contact: 'Contact Us',
    rateApp: 'Rate the App',
  },

  premium: {
    title: 'Premium',
    subtitle: 'Upgrade for the best note-taking experience',

    // Features
    features: {
      noAds: 'No ads, ever',
      unlimitedImages: 'Unlimited images',
      cloudSync: 'Cloud sync across devices',
      locationBlocks: 'Location blocks',
      albumView: 'Album view',
      customThemes: 'Custom themes',
      prioritySupport: 'Priority support',
    },

    // Pricing
    monthly: 'Monthly',
    annual: 'Annual',
    perMonth: '/month',
    perYear: '/year',
    bestValue: 'Best Value',
    savePercent: 'Save {{percent}}%',

    // Actions
    subscribe: 'Subscribe',
    restore: 'Restore Purchase',

    // Status
    subscribedUntil: 'Subscribed until {{date}}',
    willRenew: 'Renews automatically',
    cancelled: 'Cancelled - expires {{date}}',

    // Legal
    termsNotice: 'Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.',
  },

  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',

    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',

    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    sendResetLink: 'Send Reset Link',
    resetLinkSent: 'Check your email for the reset link',

    orContinueWith: 'or continue with',
    continueWithGoogle: 'Continue with Google',

    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',

    errors: {
      invalidEmail: 'Please enter a valid email',
      passwordTooShort: 'Password must be at least 8 characters',
      passwordsNoMatch: 'Passwords do not match',
      invalidCredentials: 'Invalid email or password',
      emailInUse: 'This email is already registered',
      networkError: 'Network error. Please try again.',
    },
  },

  errors: {
    generic: 'Something went wrong',
    network: 'Check your internet connection',
    notFound: 'Not found',
    unauthorized: 'Please sign in to continue',
    serverError: 'Server error. Please try again later.',
  },
};
```

### lib/i18n/locales/pt-BR.ts

```typescript
export default {
  common: {
    // Actions
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    done: 'Concluído',
    back: 'Voltar',
    close: 'Fechar',
    create: 'Criar',
    add: 'Adicionar',
    remove: 'Remover',
    search: 'Buscar',

    // States
    loading: 'Carregando...',
    error: 'Algo deu errado',
    empty: 'Nada aqui',
    retry: 'Tentar novamente',

    // Confirmations
    areYouSure: 'Tem certeza?',
    yes: 'Sim',
    no: 'Não',

    // Time
    today: 'Hoje',
    yesterday: 'Ontem',
    daysAgo: '{{count}} dia atrás',
    daysAgo_plural: '{{count}} dias atrás',
  },

  notes: {
    // List screen
    title: 'Tome Nota',
    noNotes: 'Nenhuma nota ainda',
    createFirst: 'Toque em + para criar sua primeira nota',

    // Actions
    newNote: 'Nova Nota',
    archive: 'Arquivar',
    unarchive: 'Desarquivar',
    deleteNote: 'Excluir Nota',
    deleteConfirm: 'Excluir esta nota? Esta ação não pode ser desfeita.',

    // Note detail
    untitled: 'Sem título',
    notePlaceholder: 'Título da nota',

    // Sections
    addSection: 'Adicionar Seção',
    sectionTitle: 'Título da seção',
    sectionSubtitle: 'Subtítulo (opcional)',
    deleteSection: 'Excluir Seção',

    // Blocks
    addBlock: 'Adicionar Bloco',
    textBlock: 'Texto',
    checklistBlock: 'Checklist',
    listBlock: 'Lista',
    imageBlock: 'Imagem',
    locationBlock: 'Localização',

    // Block content
    enterText: 'Digite o texto...',
    addItem: 'Adicionar item',
    item: 'Item',

    // Categories & Tags
    category: 'Categoria',
    noCategory: 'Sem categoria',
    selectCategory: 'Selecionar categoria',
    createCategory: 'Criar "{{name}}"',

    tags: 'Tags',
    noTags: 'Sem tags',
    addTag: 'Adicionar Tag',
    createTag: 'Criar "{{name}}"',

    // Views
    listView: 'Lista',
    albumView: 'Álbum',

    // Archive
    archived: 'Arquivado',
    archivedNotes: 'Notas Arquivadas',
    noArchivedNotes: 'Nenhuma nota arquivada',
  },

  settings: {
    title: 'Configurações',

    // Sections
    account: 'Conta',
    preferences: 'Preferências',
    about: 'Sobre',

    // Account
    signIn: 'Entrar',
    signOut: 'Sair',
    signOutConfirm: 'Tem certeza que deseja sair?',
    email: 'E-mail',
    notSignedIn: 'Não conectado',

    // Preferences
    language: 'Idioma',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    themeSystem: 'Sistema',

    // Premium
    premium: 'Premium',
    upgradeToPremium: 'Assinar Premium',
    premiumActive: 'Premium Ativo',
    restorePurchases: 'Restaurar Compras',
    manageSubscription: 'Gerenciar Assinatura',

    // About
    version: 'Versão',
    privacyPolicy: 'Política de Privacidade',
    termsOfService: 'Termos de Uso',
    contact: 'Fale Conosco',
    rateApp: 'Avaliar o App',
  },

  premium: {
    title: 'Premium',
    subtitle: 'Assine para a melhor experiência em anotações',

    // Features
    features: {
      noAds: 'Sem anúncios',
      unlimitedImages: 'Imagens ilimitadas',
      cloudSync: 'Sincronização na nuvem',
      locationBlocks: 'Blocos de localização',
      albumView: 'Visualização em álbum',
      customThemes: 'Temas personalizados',
      prioritySupport: 'Suporte prioritário',
    },

    // Pricing
    monthly: 'Mensal',
    annual: 'Anual',
    perMonth: '/mês',
    perYear: '/ano',
    bestValue: 'Melhor Valor',
    savePercent: 'Economize {{percent}}%',

    // Actions
    subscribe: 'Assinar',
    restore: 'Restaurar Compra',

    // Status
    subscribedUntil: 'Assinatura até {{date}}',
    willRenew: 'Renovação automática',
    cancelled: 'Cancelado - expira em {{date}}',

    // Legal
    termsNotice: 'Assinaturas são renovadas automaticamente, a menos que sejam canceladas com pelo menos 24 horas de antecedência do fim do período atual.',
  },

  auth: {
    signIn: 'Entrar',
    signUp: 'Criar Conta',

    email: 'E-mail',
    password: 'Senha',
    confirmPassword: 'Confirmar Senha',

    forgotPassword: 'Esqueceu a senha?',
    resetPassword: 'Redefinir Senha',
    sendResetLink: 'Enviar Link',
    resetLinkSent: 'Verifique seu e-mail para o link de redefinição',

    orContinueWith: 'ou continue com',
    continueWithGoogle: 'Continuar com Google',

    noAccount: 'Não tem uma conta?',
    haveAccount: 'Já tem uma conta?',

    errors: {
      invalidEmail: 'Digite um e-mail válido',
      passwordTooShort: 'A senha deve ter pelo menos 8 caracteres',
      passwordsNoMatch: 'As senhas não coincidem',
      invalidCredentials: 'E-mail ou senha inválidos',
      emailInUse: 'Este e-mail já está cadastrado',
      networkError: 'Erro de conexão. Tente novamente.',
    },
  },

  errors: {
    generic: 'Algo deu errado',
    network: 'Verifique sua conexão com a internet',
    notFound: 'Não encontrado',
    unauthorized: 'Faça login para continuar',
    serverError: 'Erro no servidor. Tente novamente mais tarde.',
  },
};
```

---

## 5. Using Translations

### Initialize in App

```typescript
// app/_layout.tsx
import '@/lib/i18n'; // Import to initialize

export default function RootLayout() {
  // ... rest of layout
}
```

### useTranslation Hook

The primary way to use translations in components:

```typescript
import { useTranslation } from 'react-i18next';

export function NotesListScreen() {
  const { t } = useTranslation('notes');

  return (
    <View>
      <Text>{t('title')}</Text>
      <Text>{t('noNotes')}</Text>

      {/* Access other namespaces */}
      <Button title={t('common:cancel')} />

      {/* With interpolation */}
      <Text>{t('createCategory', { name: searchTerm })}</Text>
    </View>
  );
}
```

### Multiple Namespaces

```typescript
const { t } = useTranslation(['notes', 'common']);

// First namespace is default
t('title');           // notes:title
t('common:cancel');   // common:cancel
```

### Trans Component (for JSX interpolation)

```typescript
import { Trans } from 'react-i18next';

// When you need to embed components in translations
<Trans
  i18nKey="notes:deleteConfirm"
  components={{ bold: <Text style={{ fontWeight: 'bold' }} /> }}
/>
```

---

## 6. Language Detection

### Automatic Detection Flow

```
1. Check AsyncStorage for saved preference
   ↓ (if not found)
2. Get device language from expo-localization
   ↓ (map to supported language)
3. Fall back to English
```

### Device Language Detection

```typescript
import * as Localization from 'expo-localization';

// Get device locales (ordered by preference)
const locales = Localization.getLocales();
// [{ languageTag: 'pt-BR', languageCode: 'pt', ... }, ...]

// Get primary locale
const primaryLocale = locales[0]?.languageTag;
// 'pt-BR' or 'en-US' etc.
```

---

## 7. Language Switching

### Language Selector Component

```typescript
// components/LanguageSelector.tsx
import { useTranslation } from 'react-i18next';
import { getAvailableLanguages, setLanguage } from '@/lib/i18n';

export function LanguageSelector() {
  const { i18n, t } = useTranslation('settings');
  const languages = getAvailableLanguages();
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (languageCode: string) => {
    await setLanguage(languageCode);
  };

  return (
    <View>
      <Text>{t('language')}</Text>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          onPress={() => handleLanguageChange(lang.code)}
          style={[
            styles.option,
            currentLanguage === lang.code && styles.selected,
          ]}
        >
          <Text>{lang.nativeName}</Text>
          {currentLanguage === lang.code && <Text>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Settings Screen Integration

```typescript
// In settings screen
<SettingsRow
  label={t('language')}
  value={getCurrentLanguageName()}
  onPress={() => showLanguageSelector()}
/>
```

---

## 8. Advanced Features

### Pluralization

i18next handles plurals automatically:

```typescript
// en.ts
{
  daysAgo: '{{count}} day ago',
  daysAgo_plural: '{{count}} days ago',
}

// pt-BR.ts
{
  daysAgo: '{{count}} dia atrás',
  daysAgo_plural: '{{count}} dias atrás',
}

// Usage
t('daysAgo', { count: 1 });  // "1 day ago"
t('daysAgo', { count: 5 });  // "5 days ago"
```

### Interpolation

```typescript
// Definition
{
  createCategory: 'Create "{{name}}"',
  welcomeUser: 'Welcome, {{name}}!',
  itemCount: '{{count}} of {{total}} items',
}

// Usage
t('createCategory', { name: 'Work' });
t('welcomeUser', { name: 'John' });
t('itemCount', { count: 5, total: 10 });
```

### Date Formatting

Use `expo-localization` for locale-aware date formatting:

```typescript
import * as Localization from 'expo-localization';

function formatDate(date: Date): string {
  return date.toLocaleDateString(Localization.locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// English: "Jan 15, 2025"
// Portuguese: "15 de jan. de 2025"
```

### Number Formatting

```typescript
function formatNumber(num: number): string {
  return num.toLocaleString(Localization.locale);
}

// English: "1,234.56"
// Portuguese: "1.234,56"
```

### Currency Formatting

```typescript
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return amount.toLocaleString(Localization.locale, {
    style: 'currency',
    currency,
  });
}

// formatCurrency(19.99, 'BRL')
// Portuguese: "R$ 19,99"
```

---

## 9. Best Practices

### Translation Keys

```typescript
// ✓ Good - Descriptive, hierarchical
'notes.list.empty'
'notes.detail.deleteConfirm'
'settings.account.signOut'

// ✗ Bad - Vague, flat
'empty'
'message1'
'btn_ok'
```

### Keep Translations in Context

```typescript
// ✓ Good - Full sentences for context
{
  deleteConfirm: 'Delete this note? This cannot be undone.',
}

// ✗ Bad - Fragments that may be combined incorrectly
{
  delete: 'Delete',
  thisNote: 'this note',
  cannotUndo: 'This cannot be undone',
}
```

### Avoid String Concatenation

```typescript
// ✓ Good - Single translation with interpolation
t('itemCount', { count: 5, total: 10 })

// ✗ Bad - Concatenation breaks in other languages
t('showing') + ' ' + count + ' ' + t('of') + ' ' + total
```

### Handle Text Expansion

Portuguese text is typically 20-30% longer than English. Design UI to accommodate:

```typescript
// Allow text to wrap or truncate gracefully
<Text numberOfLines={2} ellipsizeMode="tail">
  {t('longDescription')}
</Text>

// Use flexible layouts
<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
```

### Don't Translate

- Brand names ("Tome Nota")
- Technical terms when appropriate
- User-generated content
- Numbers (use formatting instead)

---

## 10. Testing

### Test All Languages

Create a helper to test translations exist:

```typescript
// scripts/check-translations.ts
import en from '../lib/i18n/locales/en';
import ptBR from '../lib/i18n/locales/pt-BR';

function getAllKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      return getAllKeys(value, fullKey);
    }
    return [fullKey];
  });
}

const enKeys = getAllKeys(en);
const ptBRKeys = getAllKeys(ptBR);

const missingInPtBR = enKeys.filter((k) => !ptBRKeys.includes(k));
const missingInEn = ptBRKeys.filter((k) => !enKeys.includes(k));

if (missingInPtBR.length) {
  console.log('Missing in pt-BR:', missingInPtBR);
}
if (missingInEn.length) {
  console.log('Missing in en:', missingInEn);
}
```

### Manual Testing Checklist

- [ ] Switch language in settings
- [ ] Verify language persists after app restart
- [ ] Check all screens in both languages
- [ ] Verify dates/numbers format correctly
- [ ] Test text expansion doesn't break layouts
- [ ] Verify device language detection works

### Development Helper

Force a specific language during development:

```typescript
// Temporary override for testing
import i18n from '@/lib/i18n';

// Force Portuguese for testing
i18n.changeLanguage('pt-BR');
```

---

## Type Safety (Optional)

For TypeScript type checking on translation keys:

```typescript
// lib/i18n/types.ts
import en from './locales/en';

// Create type from English translations (source of truth)
type TranslationKeys = typeof en;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: TranslationKeys['common'];
      notes: TranslationKeys['notes'];
      settings: TranslationKeys['settings'];
      premium: TranslationKeys['premium'];
      auth: TranslationKeys['auth'];
      errors: TranslationKeys['errors'];
    };
  }
}
```

This enables autocomplete and type checking for translation keys.

---

## Implementation Checklist

- [ ] Install dependencies (`i18next`, `react-i18next`, `expo-localization`)
- [ ] Create folder structure (`lib/i18n/`)
- [ ] Create configuration file (`lib/i18n/index.ts`)
- [ ] Create English translations (`lib/i18n/locales/en.ts`)
- [ ] Create Portuguese translations (`lib/i18n/locales/pt-BR.ts`)
- [ ] Import i18n in root layout
- [ ] Replace hardcoded strings with `t()` calls
- [ ] Add language selector to settings
- [ ] Test language switching
- [ ] Test device language detection
- [ ] Verify text expansion in UI
- [ ] Add missing translation check script
