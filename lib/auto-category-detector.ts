/**
 * Intelligente Kategoriezuweisung für CSV-Import
 * Erkennt automatisch die richtige Kategorie basierend auf der Transaktionsbeschreibung
 */

export interface CategoryPattern {
  keywords: string[];
  categoryName: string;
  priority: number; // Höhere Priorität wird zuerst geprüft
}

// Schweizer Marken und Keywords für automatische Kategoriezuweisung
export const categoryPatterns: CategoryPattern[] = [
  // Tanken / Fuel
  {
    keywords: ['socar', 'shell', 'esso', 'bp', 'tamoil', 'avia', 'agrola', 'tankstelle', 'tanken'],
    categoryName: 'Tanken',
    priority: 100,
  },
  
  // Versicherung / Insurance
  {
    keywords: ['axa', 'css', 'swica', 'helsana', 'sanitas', 'visana', 'assura', 'groupe mutuel', 'versicherung', 'insurance', 'prämie', 'kranken'],
    categoryName: 'Versicherung',
    priority: 100,
  },
  
  // Transport / Public Transport
  {
    keywords: ['sbb', 'bls', 'zürcher verkehrsbetriebe', 'zvv', 'tpg', 'vbz', 'mob', 'rhb', 'ga', 'halbtax', 'generalabo', 'billett'],
    categoryName: 'Transport',
    priority: 90,
  },
  
  // Lebensmittel / Groceries
  {
    keywords: ['migros', 'coop', 'aldi', 'lidl', 'denner', 'volg', 'spar', 'manor food'],
    categoryName: 'Essen & Trinken',
    priority: 80,
  },
  
  // Restaurant & Café
  {
    keywords: ['restaurant', 'café', 'mcdonalds', 'burger king', 'starbucks', 'pizza', 'kebab', 'takeaway'],
    categoryName: 'Essen & Trinken',
    priority: 75,
  },
  
  // Telekommunikation
  {
    keywords: ['swisscom', 'sunrise', 'salt', 'mobilezone', 'yallo', 'wingo', 'lebara'],
    categoryName: 'Nebenkosten',
    priority: 85,
  },
  
  // Finanzen / Banking
  {
    keywords: ['postfinance', 'ubs', 'credit suisse', 'raiffeisen', 'zürcher kantonalbank', 'zkb', 'bcv', 'bancomat', 'geldautomat'],
    categoryName: 'Sonstiges',
    priority: 70,
  },
  
  // Elektronik & Technik
  {
    keywords: ['digitec', 'galaxus', 'manor', 'media markt', 'interdiscount', 'fust'],
    categoryName: 'Einkaufen',
    priority: 75,
  },
  
  // Kleidung / Fashion
  {
    keywords: ['h&m', 'zara', 'manor mode', 'c&a', 'chicorée', 'esprit', 'peek & cloppenburg'],
    categoryName: 'Einkaufen',
    priority: 75,
  },
  
  // Gesundheit / Healthcare
  {
    keywords: ['apotheke', 'pharmacy', 'arzt', 'doctor', 'zahnarzt', 'spital', 'hospital', 'praxis', 'sun store', 'amavita', 'toppharm'],
    categoryName: 'Gesundheit',
    priority: 90,
  },
  
  // Sport & Fitness
  {
    keywords: ['fitness', 'gym', 'migros fitnesspark', 'activ fitness', 'kieser', 'pure'],
    categoryName: 'Gesundheit',
    priority: 85,
  },
  
  // Unterhaltung / Entertainment
  {
    keywords: ['kino', 'cinema', 'pathé', 'blue cinema', 'netflix', 'spotify', 'disney', 'apple music', 'youtube premium'],
    categoryName: 'Unterhaltung',
    priority: 80,
  },
  
  // Reisen / Travel
  {
    keywords: ['booking', 'airbnb', 'hotel', 'flixbus', 'blablacar', 'swiss international', 'easyjet', 'lufthansa'],
    categoryName: 'Reisen',
    priority: 85,
  },
  
  // Wohnung / Housing
  {
    keywords: ['miete', 'rent', 'immobilien', 'wohnung', 'apartment', 'nebenkosten', 'hausverwaltung'],
    categoryName: 'Wohnung',
    priority: 95,
  },
  
  // Utilities
  {
    keywords: ['ewz', 'swisspower', 'romande energie', 'strom', 'electricity', 'wasser', 'water', 'gas', 'heating', 'heizung'],
    categoryName: 'Nebenkosten',
    priority: 90,
  },
  
  // Gehalt / Salary
  {
    keywords: ['lohn', 'gehalt', 'salary', 'salaire', 'arbeitgeber', 'employer', 'lohnzahlung'],
    categoryName: 'Gehalt',
    priority: 100,
  },
  
  // Fallback für unbekannte Ausgaben
  {
    keywords: ['kauf', 'purchase', 'bezahlung', 'payment', 'rechnung', 'invoice'],
    categoryName: 'Sonstiges',
    priority: 10,
  },
];

/**
 * Findet die passende Kategorie basierend auf der Transaktionsbeschreibung
 * @param description - Die Beschreibung der Transaktion
 * @returns Der Name der Kategorie oder null
 */
export function detectCategory(description: string): string | null {
  if (!description) return null;
  
  const normalizedDescription = description.toLowerCase();
  let bestMatch: CategoryPattern | null = null;
  let bestPriority = -1;
  
  for (const pattern of categoryPatterns) {
    for (const keyword of pattern.keywords) {
      if (normalizedDescription.includes(keyword.toLowerCase())) {
        if (pattern.priority > bestPriority) {
          bestMatch = pattern;
          bestPriority = pattern.priority;
        }
        break; // Break inner loop, continue with next pattern
      }
    }
  }
  
  return bestMatch?.categoryName || null;
}

/**
 * Findet die Kategorie-ID basierend auf dem Kategorienamen
 * @param categories - Liste aller verfügbaren Kategorien
 * @param categoryName - Name der gesuchten Kategorie
 * @returns Die ID der Kategorie oder null
 */
export function getCategoryIdByName(
  categories: Array<{ id: string; name: string }>,
  categoryName: string
): string | null {
  const category = categories.find(c => 
    c.name.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.id || null;
}

/**
 * Vollständiger Auto-Detect Workflow für CSV-Import
 * @param description - Transaktionsbeschreibung
 * @param categories - Liste aller Kategorien
 * @returns Die Kategorie-ID oder null
 */
export function autoDetectCategoryId(
  description: string,
  categories: Array<{ id: string; name: string }>
): string | null {
  const categoryName = detectCategory(description);
  if (!categoryName) return null;
  
  return getCategoryIdByName(categories, categoryName);
}

// Beispiel-Usage für Tests
export const exampleUsage = {
  'Kauf/Dienstleistung vom 18.11.2025, Coop-2244 Bâar Gotthard': 'Essen & Trinken',
  'Apple Pay Kauf/Dienstleistung vom 18.11.2025, Lidl 315': 'Essen & Trinken',
  'Apple Pay Kauf/Dienstleistung vom 11.11.2025, Socar Charging Po': 'Tanken',
  'CSS Krankenkasse Prämie November': 'Versicherung',
  'AXA Versicherung Mobilität': 'Versicherung',
  'SBB GA Jahresabo': 'Transport',
  'Swisscom Rechnung': 'Nebenkosten',
  'Migros Take Away Znacht': 'Essen & Trinken',
};
