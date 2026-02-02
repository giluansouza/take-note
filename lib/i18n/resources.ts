import en from './locales/en';
import ptBR from './locales/pt-BR';

export const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
};

export const availableLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
];
