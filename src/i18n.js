import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class I18n {
  constructor() {
    this.locale = process.env.LANGUAGE || 'zh_CN';
    this.translations = {};
    this.loadTranslations();
  }

  loadTranslations() {
    try {
      const translationPath = join(__dirname, '..', 'locales', `${this.locale}.json`);
      const data = readFileSync(translationPath, 'utf8');
      this.translations = JSON.parse(data);
    } catch (error) {
      // Fallback to English if translation file not found
      try {
        const fallbackPath = join(__dirname, '..', 'locales', 'en.json');
        const data = readFileSync(fallbackPath, 'utf8');
        this.translations = JSON.parse(data);
        console.warn(`Translation file for ${this.locale} not found, using English as fallback.`);
      } catch (fallbackError) {
        console.error('Failed to load translation files:', fallbackError.message);
        this.translations = {};
      }
    }
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    // Handle string interpolation
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }

    return value;
  }

  setLocale(locale) {
    this.locale = locale;
    this.loadTranslations();
  }

  getLocale() {
    return this.locale;
  }
}

// Create singleton instance
const i18n = new I18n();

export const t = i18n.t.bind(i18n);
export const setLocale = i18n.setLocale.bind(i18n);
export const getLocale = i18n.getLocale.bind(i18n);
export default i18n;
