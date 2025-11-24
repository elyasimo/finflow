/**
 * Translation utilities for displaying translated database content
 */

export type SupportedLanguage = 'en' | 'de' | 'fr' | 'ar';

export interface TranslationMap {
  en?: string;
  de?: string;
  fr?: string;
  ar?: string;
}

/**
 * Gets the translated text for the current language
 * Falls back to original text if translation is not available
 *
 * @param originalText The original text (usually in the language it was created)
 * @param translations The translation map containing translations for all languages
 * @param currentLanguage The current UI language
 * @returns The translated text or original text as fallback
 */
export function getTranslatedText(
  originalText: string | null | undefined,
  translations: TranslationMap | null | undefined,
  currentLanguage: SupportedLanguage
): string {
  // Return empty string if no original text
  if (!originalText) return '';

  // If no translations available, return original text
  if (!translations || typeof translations !== 'object') {
    return originalText;
  }

  // Try to get translation for current language
  const translated = translations[currentLanguage];

  // Return translated text if available, otherwise return original
  return translated && translated.trim().length > 0 ? translated : originalText;
}

/**
 * Checks if translations exist for an entity
 */
export function hasTranslations(translations: TranslationMap | null | undefined): boolean {
  if (!translations || typeof translations !== 'object') return false;

  const translationValues = Object.values(translations);
  return translationValues.some(value => value && value.trim().length > 0);
}

/**
 * Gets all available translations for an entity
 */
export function getAllTranslations(
  originalText: string | null | undefined,
  translations: TranslationMap | null | undefined
): { language: SupportedLanguage; text: string }[] {
  if (!originalText) return [];

  const result: { language: SupportedLanguage; text: string }[] = [];
  const languages: SupportedLanguage[] = ['en', 'de', 'fr', 'ar'];

  for (const lang of languages) {
    const text = translations?.[lang] || originalText;
    if (text && text.trim().length > 0) {
      result.push({ language: lang, text });
    }
  }

  return result;
}
