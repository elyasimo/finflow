/**
 * Backend Auto-Category Detection für CSV-Import
 * Erkennt automatisch die richtige Kategorie basierend auf der Transaktionsbeschreibung
 */

export interface CategoryPattern {
  keywords: string[];
  categoryName: string;
  priority: number;
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
  
  // Elektronik & Technik
  {
    keywords: ['digitec', 'galaxus', 'manor', 'media markt', 'interdiscount', 'fust'],
    categoryName: 'Einkaufen',
    priority: 75,
  },
  
  // Gesundheit / Healthcare
  {
    keywords: ['apotheke', 'pharmacy', 'arzt', 'doctor', 'zahnarzt', 'spital', 'hospital', 'praxis', 'sun store', 'amavita', 'toppharm'],
    categoryName: 'Gesundheit',
    priority: 90,
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
        break;
      }
    }
  }
  
  return bestMatch?.categoryName || null;
}

/**
 * Findet die Kategorie-ID basierend auf dem Kategorienamen
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
