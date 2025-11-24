import React from 'react';
import {
  LidlIcon,
  AldiIcon,
  MigrosIcon,
  CoopIcon,
  SBBIcon,
  SwisscomIcon,
  CSSIcon,
  AXAIcon,
  SocarIcon,
  ShellIcon,
  PostFinanceIcon,
} from '@/components/icons/swiss-brand-icons';

// Modern 3D Transaction Icons with Gradients

// Shopping / Einkaufen
export const ShoppingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shopping-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B6B" />
        <stop offset="100%" stopColor="#FF8E53" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#shopping-gradient)" opacity="0.15"/>
    <path d="M7 18C5.9 18 5.01 18.9 5.01 20C5.01 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20C9 18.9 8.1 18 7 18ZM17 18C15.9 18 15.01 18.9 15.01 20C15.01 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20C19 18.9 18.1 18 17 18ZM7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L21.16 4.96L19.42 4H19.41L18.31 6L15.55 11H8.53L8.4 10.73L6.16 6L5.21 4L4.27 2H1V4H3L6.6 11.59L5.25 14.03C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.29 15 7.17 14.89 7.17 14.75Z" fill="url(#shopping-gradient)"/>
  </svg>
);

// Food / Restaurant
export const FoodIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="food-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B9D" />
        <stop offset="100%" stopColor="#C44569" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#food-gradient)" opacity="0.15"/>
    <path d="M11 9H9V2H7V9H5V2H3V9C3 11.12 4.66 12.84 6.75 12.97V22H9.25V12.97C11.34 12.84 13 11.12 13 9V2H11V9ZM16 6V14H18.5V22H21V2C18.24 2 16 4.24 16 6Z" fill="url(#food-gradient)"/>
  </svg>
);

// Transport / Auto
export const TransportIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="transport-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A90E2" />
        <stop offset="100%" stopColor="#357ABD" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#transport-gradient)" opacity="0.15"/>
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM6.5 16C5.67 16 5 15.33 5 14.5C5 13.67 5.67 13 6.5 13C7.33 13 8 13.67 8 14.5C8 15.33 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5C16 13.67 16.67 13 17.5 13C18.33 13 19 13.67 19 14.5C19 15.33 18.33 16 17.5 16ZM5 11L6.5 6.5H17.5L19 11H5Z" fill="url(#transport-gradient)"/>
  </svg>
);

// Fuel / Tanken
export const FuelIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fuel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFA726" />
        <stop offset="100%" stopColor="#FF7043" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#fuel-gradient)" opacity="0.15"/>
    <path d="M19.77 7.23L19.78 7.22L16.06 3.5L15 4.56L17.11 6.67C16.17 7.03 15.5 7.93 15.5 9V19H7V4H14V9H16V4C16 2.9 15.1 2 14 2H7C5.9 2 5 2.9 5 4V19C5 20.1 5.9 21 7 21H10V22H11V21H12V22H13V21H15.5C16.6 21 17.5 20.1 17.5 19V12H19.5V9C19.5 8.31 19.22 7.68 18.77 7.23ZM18 10.5V9C18 8.45 18.45 8 19 8C19.55 8 20 8.45 20 9V10.5H18Z" fill="url(#fuel-gradient)"/>
  </svg>
);

// Housing / Wohnen
export const HousingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="housing-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6A11CB" />
        <stop offset="100%" stopColor="#2575FC" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#housing-gradient)" opacity="0.15"/>
    <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="url(#housing-gradient)"/>
  </svg>
);

// Utilities / Strom
export const UtilitiesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="utilities-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD93D" />
        <stop offset="100%" stopColor="#F7B731" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#utilities-gradient)" opacity="0.15"/>
    <path d="M7 2V13H10V22L17 10H13L17 2H7Z" fill="url(#utilities-gradient)"/>
  </svg>
);

// Phone / Telecom
export const PhoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="phone-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00D2FF" />
        <stop offset="100%" stopColor="#3A7BD5" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#phone-gradient)" opacity="0.15"/>
    <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="url(#phone-gradient)"/>
  </svg>
);

// Internet / Wifi
export const InternetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="internet-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667EEA" />
        <stop offset="100%" stopColor="#764BA2" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#internet-gradient)" opacity="0.15"/>
    <path d="M1 9L2 10C7.52 4.48 16.48 4.48 22 10L23 9C16.93 2.93 7.08 2.93 1 9ZM9 17L12 20L15 17C13.35 15.34 10.66 15.34 9 17ZM5 13L6 14C9.87 10.13 14.13 10.13 18 14L19 13C14.59 8.59 9.41 8.59 5 13Z" fill="url(#internet-gradient)"/>
  </svg>
);

// Insurance / Versicherung
export const InsuranceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="insurance-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FA709A" />
        <stop offset="100%" stopColor="#FEE140" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#insurance-gradient)" opacity="0.15"/>
    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z" fill="url(#insurance-gradient)"/>
  </svg>
);

// Health / Gesundheit
export const HealthIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="health-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E30613" />
        <stop offset="100%" stopColor="#C10510" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#health-gradient)" opacity="0.15"/>
    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM18 14H14V18H10V14H6V10H10V6H14V10H18V14Z" fill="url(#health-gradient)"/>
  </svg>
);

// Education / Bildung
export const EducationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="education-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A90E2" />
        <stop offset="100%" stopColor="#9B59B6" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#education-gradient)" opacity="0.15"/>
    <path d="M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18ZM12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" fill="url(#education-gradient)"/>
  </svg>
);

// Travel / Reisen
export const TravelIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="travel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00B4DB" />
        <stop offset="100%" stopColor="#0083B0" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#travel-gradient)" opacity="0.15"/>
    <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" fill="url(#travel-gradient)"/>
  </svg>
);

// Gift / Geschenke
export const GiftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gift-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F093FB" />
        <stop offset="100%" stopColor="#F5576C" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#gift-gradient)" opacity="0.15"/>
    <path d="M20 6H17.82C17.93 5.69 18 5.35 18 5C18 3.34 16.66 2 15 2C13.95 2 13.04 2.54 12.5 3.35L12 4.02L11.5 3.34C10.96 2.54 10.05 2 9 2C7.34 2 6 3.34 6 5C6 5.35 6.07 5.69 6.18 6H4C2.9 6 2.01 6.9 2.01 8L2 19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM15 4C15.55 4 16 4.45 16 5C16 5.55 15.55 6 15 6C14.45 6 14 5.55 14 5C14 4.45 14.45 4 15 4ZM9 4C9.55 4 10 4.45 10 5C10 5.55 9.55 6 9 6C8.45 6 8 5.55 8 5C8 4.45 8.45 4 9 4ZM20 19H4V17H20V19ZM20 14H4V8H9.08L7 10.83L8.62 12L11 8.76L12 7.4L13 8.76L15.38 12L17 10.83L14.92 8H20V14Z" fill="url(#gift-gradient)"/>
  </svg>
);

// Business / Büro
export const BusinessIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="business-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#434343" />
        <stop offset="100%" stopColor="#000000" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#business-gradient)" opacity="0.15"/>
    <path d="M10 16V8C10 6.9 10.9 6 12 6H21V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V18H12C10.9 18 10 17.1 10 16ZM13 8C12.45 8 12 8.45 12 9V15C12 15.55 12.45 16 13 16H22V8H13ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" fill="url(#business-gradient)"/>
  </svg>
);

// Coffee
export const CoffeeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="coffee-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B4513" />
        <stop offset="100%" stopColor="#5C2E1D" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#coffee-gradient)" opacity="0.15"/>
    <path d="M20 3H4V13C4 14.1 4.9 15 6 15H15C16.1 15 17 14.1 17 13V10H18C19.11 10 20 9.11 20 8V5C20 3.89 19.11 3 20 3ZM18 8H17V5H18V8ZM4 19H20V21H4V19Z" fill="url(#coffee-gradient)"/>
  </svg>
);

// Income / Wallet
export const IncomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="income-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#11998E" />
        <stop offset="100%" stopColor="#38EF7D" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#income-gradient)" opacity="0.15"/>
    <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" fill="url(#income-gradient)"/>
  </svg>
);

// Transfer / Credit Card
export const TransferIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="transfer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8E2DE2" />
        <stop offset="100%" stopColor="#4A00E0" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#transfer-gradient)" opacity="0.15"/>
    <path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="url(#transfer-gradient)"/>
  </svg>
);

// Icon component mapping
type IconComponent = () => JSX.Element;

export function getTransactionIcon(description: string, type: string): { icon: IconComponent; category: string } {
  const desc = description.toLowerCase();

  // PRIORITY 1: Swiss Brand Icons (Exact Match)
  if (desc.includes('lidl')) return { icon: LidlIcon, category: 'groceries' };
  if (desc.includes('aldi')) return { icon: AldiIcon, category: 'groceries' };
  if (desc.includes('migros')) return { icon: MigrosIcon, category: 'groceries' };
  if (desc.includes('coop')) return { icon: CoopIcon, category: 'groceries' };
  if (desc.includes('swisscom')) return { icon: SwisscomIcon, category: 'telecom' };
  if (desc.includes('css') && (desc.includes('kranken') || desc.includes('versicherung'))) return { icon: CSSIcon, category: 'insurance' };
  if (desc.includes('axa')) return { icon: AXAIcon, category: 'insurance' };
  if (desc.includes('sbb') || (desc.includes('bahn') && !desc.includes('auto'))) return { icon: SBBIcon, category: 'transport' };
  if (desc.includes('socar')) return { icon: SocarIcon, category: 'fuel' };
  if (desc.includes('shell')) return { icon: ShellIcon, category: 'fuel' };
  if (desc.includes('postfinance') || desc.includes('post finance')) return { icon: PostFinanceIcon, category: 'bank' };
  
  // PRIORITY 2: Category-based Generic Icons
  // Telekommunikation & Internet
  if (desc.includes('telecom') || desc.includes('mobile') || desc.includes('handy')) {
    return { icon: PhoneIcon, category: 'telecom' };
  }
  if (desc.includes('wifi') || desc.includes('internet') || desc.includes('broadband')) {
    return { icon: InternetIcon, category: 'internet' };
  }

  // Versicherungen & Banken
  if (desc.includes('versicherung') || desc.includes('insurance') || desc.includes('krankenkasse')) {
    return { icon: InsuranceIcon, category: 'insurance' };
  }

  // Tanken & Auto
  if (desc.includes('tank') || desc.includes('benzin') || desc.includes('diesel') || desc.includes('esso') || desc.includes('bp')) {
    return { icon: FuelIcon, category: 'fuel' };
  }
  if (desc.includes('auto') || desc.includes('car') || desc.includes('garage') || desc.includes('parking') || desc.includes('zug')) {
    return { icon: TransportIcon, category: 'transport' };
  }

  // Lebensmittel & Restaurants
  if (desc.includes('supermarkt') || desc.includes('lebensmittel') || desc.includes('grocery') || desc.includes('denner')) {
    return { icon: ShoppingIcon, category: 'groceries' };
  }
  if (desc.includes('restaurant') || desc.includes('mcdonald') || desc.includes('burger') || desc.includes('pizza') ||
      desc.includes('starbucks') || desc.includes('café') || desc.includes('cafe') || desc.includes('bar') || desc.includes('babos')) {
    return { icon: FoodIcon, category: 'food' };
  }
  if (desc.includes('coffee') || desc.includes('kaffee')) {
    return { icon: CoffeeIcon, category: 'coffee' };
  }

  // Wohnen
  if (desc.includes('miete') || desc.includes('rent') || desc.includes('wohnung') || desc.includes('apartment')) {
    return { icon: HousingIcon, category: 'housing' };
  }
  if (desc.includes('strom') || desc.includes('electricity') || desc.includes('energie') || desc.includes('ewz')) {
    return { icon: UtilitiesIcon, category: 'utilities' };
  }

  // Einkaufen
  if (desc.includes('manor') || desc.includes('globus') || desc.includes('h&m') || desc.includes('zara') ||
      desc.includes('mode') || desc.includes('fashion') || desc.includes('kleid')) {
    return { icon: ShoppingIcon, category: 'shopping' };
  }

  // Gesundheit
  if (desc.includes('apotheke') || desc.includes('pharmacy') || desc.includes('arzt') || desc.includes('doctor') ||
      desc.includes('zahnarzt') || desc.includes('spital') || desc.includes('hospital')) {
    return { icon: HealthIcon, category: 'health' };
  }

  // Bildung
  if (desc.includes('schule') || desc.includes('universität') || desc.includes('uni') || desc.includes('bildung') ||
      desc.includes('kurs') || desc.includes('school') || desc.includes('education')) {
    return { icon: EducationIcon, category: 'education' };
  }

  // Reisen
  if (desc.includes('flug') || desc.includes('flight') || desc.includes('airline') || desc.includes('hotel') ||
      desc.includes('booking') || desc.includes('travel') || desc.includes('reise')) {
    return { icon: TravelIcon, category: 'travel' };
  }

  // Geschenke & Entertainment
  if (desc.includes('geschenk') || desc.includes('gift') || desc.includes('blumen') || desc.includes('flowers')) {
    return { icon: GiftIcon, category: 'gift' };
  }

  // Büro & Business
  if (desc.includes('büro') || desc.includes('office') || desc.includes('business') || desc.includes('firma')) {
    return { icon: BusinessIcon, category: 'business' };
  }

  // Default icons based on transaction type
  if (type === 'income') {
    return { icon: IncomeIcon, category: 'income' };
  } else if (type === 'expense') {
    return { icon: ShoppingIcon, category: 'shopping' };
  } else {
    return { icon: TransferIcon, category: 'transfer' };
  }
}
