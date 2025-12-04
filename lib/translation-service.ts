/**
 * Translation Service using LibreTranslate API
 * Provides automatic translation for database content
 */

export type SupportedLanguage = 'en' | 'de' | 'fr' | 'ar';

export interface TranslationResult {
  [key: string]: string; // language code -> translated text
}

/**
 * Detects the language of a given text
 * Uses a simple heuristic approach for now
 */
export function detectLanguage(text: string): SupportedLanguage {
  if (!text || text.trim().length === 0) return 'en';

  // Arabic detection (has Arabic characters)
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';

  // German-specific words and characters
  const germanWords = /\b(der|die|das|ist|und|oder|aber|mit|von|für|auf|an|zu|den|dem|des|ein|eine|einen|einem|eines|nicht|sich|sie|es|er|ich|du|wir|ihr|was|wie|wo|wann|warum|wer|werden|wurde|worden|sein|haben|hatte|hatten|wird|kann|könnte|soll|sollte|müssen|musste|dürfen|möchte|mögen|ä|ö|ü|ß)\b/i;
  if (germanWords.test(text)) return 'de';

  // French-specific words and accents
  const frenchWords = /\b(le|la|les|un|une|des|et|ou|mais|donc|car|ni|or|de|du|à|au|aux|dans|par|pour|avec|sans|sur|sous|je|tu|il|elle|nous|vous|ils|elles|est|sont|était|étaient|sera|seront|avoir|été|être|fait|faire|dit|dire|peut|peuvent|doit|doivent|ç|é|è|ê|ë|à|â|î|ï|ô|ù|û|ü)\b/i;
  if (frenchWords.test(text)) return 'fr';

  // Default to English
  return 'en';
}

/**
 * Translates text to all supported languages using LibreTranslate API
 */
export async function translateToAllLanguages(
  text: string,
  sourceLanguage?: SupportedLanguage
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return { en: '', de: '', fr: '', ar: '' };
  }

  const source = sourceLanguage || detectLanguage(text);
  const targetLanguages: SupportedLanguage[] = ['en', 'de', 'fr', 'ar'];

  const translations: TranslationResult = {
    [source]: text, // Keep original text for source language
  };

  // Use LibreTranslate public API (free, open-source)
  const LIBRETRANSLATE_API = 'https://libretranslate.com/translate';

  for (const targetLang of targetLanguages) {
    if (targetLang === source) continue; // Skip source language

    try {
      const response = await fetch(LIBRETRANSLATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: source,
          target: targetLang,
          format: 'text',
        }),
      });

      if (!response.ok) {
        translations[targetLang] = text; // Fallback to original text
        continue;
      }

      const data = await response.json();
      translations[targetLang] = data.translatedText || text;

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      translations[targetLang] = text; // Fallback to original text
    }
  }

  return translations;
}

/**
 * Translates a single text to a specific target language
 */
export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<string> {
  if (!text || text.trim().length === 0) return text;

  const source = sourceLanguage || detectLanguage(text);

  if (source === targetLanguage) return text; // No translation needed

  const LIBRETRANSLATE_API = 'https://libretranslate.com/translate';

  try {
    const response = await fetch(LIBRETRANSLATE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: source,
        target: targetLanguage,
        format: 'text',
      }),
    });

    if (!response.ok) {
      return text; // Fallback to original text
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    return text; // Fallback to original text
  }
}
