// @ts-nocheck
/**
 * Auto-Translation Service
 * Automatically translates database content when created or updated
 */

type SupportedLanguage = 'en' | 'de' | 'fr' | 'ar';

interface TranslationResult {
  en: string;
  de: string;
  fr: string;
  ar: string;
}

/**
 * Detects the language of a given text
 */
function detectLanguage(text: string): SupportedLanguage {
  if (!text || text.trim().length === 0) return 'en';

  // Arabic detection
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';

  // German-specific characters
  if (/[äöüßÄÖÜ]/.test(text)) return 'de';

  // German-specific patterns
  const germanWords = /\b(monatliche|ausgaben|augaben|november|dezember|januar|februar|märz|april|mai|juni|juli|august|september|oktober|quartal|der|die|das|ist|und|oder|aber|mit|von|für|auf|an|zu|den|dem|des|ein|eine|einen|einem|eines|nicht|sich|sie|es|er|ich|du|wir|ihr|was|wie|wo|wann|warum|wer|werden|wurde|worden|sein|haben|hatte|hatten|wird|kann|könnte|soll|sollte|müssen|musste|dürfen|möchte|mögen)\b/i;
  if (germanWords.test(text)) return 'de';

  // French-specific patterns
  const frenchWords = /\b(le|la|les|un|une|des|et|ou|mais|donc|car|ni|or|de|du|à|au|aux|dans|par|pour|avec|sans|sur|sous|je|tu|il|elle|nous|vous|ils|elles|est|sont|était|étaient|sera|seront|avoir|été|être|fait|faire|dit|dire|peut|peuvent|doit|doivent|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i;
  if (frenchWords.test(text)) return 'fr';

  return 'en';
}

/**
 * Translates text using LibreTranslate API with retry logic
 */
async function translateText(
  text: string,
  targetLang: SupportedLanguage,
  sourceLang: SupportedLanguage,
  retries = 2
): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  if (sourceLang === targetLang) return text;

  const LIBRETRANSLATE_API = process.env.LIBRETRANSLATE_API || 'https://libretranslate.com/translate';

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(LIBRETRANSLATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        }),
      });

      if (!response.ok) {
        if (response.status === 429 && attempt < retries) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      if (attempt === retries) {
        console.error(`Error translating to ${targetLang}:`, error);
        return text; // Fallback to original text
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return text;
}

/**
 * Translates text to all supported languages (async, non-blocking)
 */
export async function autoTranslate(text: string): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return { en: '', de: '', fr: '', ar: '' };
  }

  const sourceLang = detectLanguage(text);
  const targetLanguages: SupportedLanguage[] = ['en', 'de', 'fr', 'ar'];

  const translations: Partial<TranslationResult> = {
    [sourceLang]: text,
  };

  // Translate to all languages in parallel (faster!)
  const translationPromises = targetLanguages
    .filter(lang => lang !== sourceLang)
    .map(async (targetLang) => {
      const translated = await translateText(text, targetLang, sourceLang);
      return { lang: targetLang, text: translated };
    });

  const results = await Promise.allSettled(translationPromises);

  results.forEach((result, index) => {
    const targetLang = targetLanguages.filter(l => l !== sourceLang)[index];
    if (result.status === 'fulfilled') {
      translations[result.value.lang] = result.value.text;
    } else {
      // Fallback to original text on error
      translations[targetLang] = text;
    }
  });

  return translations as TranslationResult;
}

/**
 * Queue for background translation processing
 */
class TranslationQueue {
  private queue: Array<{
    table: string;
    id: string;
    field: string;
    text: string;
  }> = [];
  private processing = false;

  async add(table: string, id: string, field: string, text: string) {
    this.queue.push({ table, id, field, text });

    // Start processing if not already running
    if (!this.processing) {
      this.process();
    }
  }

  private async process() {
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      try {
        const translations = await autoTranslate(item.text);

        // Update database with translations
        const { db } = await import('../db.js');
        const { sql } = await import('drizzle-orm');

        const updateField = `${item.field}_translations`;

        await db.execute(sql`
          UPDATE ${sql.identifier(item.table)}
          SET ${sql.identifier(updateField)} = ${JSON.stringify(translations)}::jsonb
          WHERE id = ${item.id}
        `);

        console.log(`✓ Auto-translated ${item.table}.${item.field} for ID ${item.id}`);
      } catch (error) {
        console.error(`Error auto-translating ${item.table}.${item.field}:`, error);
      }

      // Rate limiting: wait between items
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    this.processing = false;
  }
}

export const translationQueue = new TranslationQueue();
