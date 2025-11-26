import React from 'react';
import { 
  Home,
  Zap,
  Droplet,
  Smartphone,
  Shield,
  Car,
  Fuel,
  ShoppingCart,
  UtensilsCrossed,
  Heart,
  Dumbbell,
  Shirt,
  Gamepad2,
  Tv,
  GraduationCap,
  Gift,
  Dog,
  Plane,
  Package,
  DollarSign,
  TrendingUp,
  CornerUpLeft,
  Wallet,
} from 'lucide-react';
import {
  SocarIcon,
  AXAIcon,
  CSSIcon,
  MigrosIcon,
  CoopIcon,
  SBBIcon,
  SwisscomIcon,
  PostFinanceIcon,
  UBSIcon,
  ShellIcon,
  AldiIcon,
  LidlIcon,
} from './swiss-brand-icons';

interface CategoryIconProps {
  iconName: string;
  className?: string;
}

// German category name to Lucide icon mapping
const getCategoryIconByName = (categoryName: string) => {
  const name = categoryName.toLowerCase().trim();
  
  // Ausgaben (Expenses)
  if (name.includes('wohnen') || name.includes('miete')) return Home;
  if (name.includes('strom')) return Zap;
  if (name.includes('wasser')) return Droplet;
  if (name.includes('internet') || name.includes('telefon') || name.includes('handy')) return Smartphone;
  if (name.includes('versicherung')) return Shield;
  if (name.includes('auto') || name.includes('transport') || name.includes('verkehr')) return Car;
  if (name.includes('tanken') || name.includes('benzin')) return Fuel;
  if (name.includes('lebensmittel') || name.includes('einkauf') || name.includes('supermarkt')) return ShoppingCart;
  if (name.includes('restaurant') || name.includes('café') || name.includes('essen')) return UtensilsCrossed;
  if (name.includes('gesundheit') || name.includes('arzt') || name.includes('medizin')) return Heart;
  if (name.includes('fitness') || name.includes('sport') || name.includes('gym')) return Dumbbell;
  if (name.includes('kleidung') || name.includes('mode') || name.includes('schuhe')) return Shirt;
  if (name.includes('freizeit') || name.includes('hobby')) return Gamepad2;
  if (name.includes('abonnement') || name.includes('abo')) return Tv;
  if (name.includes('bildung') || name.includes('schule') || name.includes('uni')) return GraduationCap;
  if (name.includes('geschenk') || name.includes('spende')) return Gift;
  if (name.includes('haustier') || name.includes('tier')) return Dog;
  if (name.includes('reise') || name.includes('urlaub') || name.includes('flug')) return Plane;
  if (name.includes('sonstig') || name.includes('andere')) return Package;
  
  // Einnahmen (Income)
  if (name.includes('gehalt') || name.includes('lohn') || name.includes('einkommen')) return DollarSign;
  if (name.includes('neben')) return Wallet;
  if (name.includes('investment') || name.includes('aktien') || name.includes('dividende')) return TrendingUp;
  if (name.includes('rückerstattung') || name.includes('erstattung')) return CornerUpLeft;
  
  // Default
  return Package;
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = '' }) => {
  // First check if it's a brand icon (swiss-brand-icons)
  const brandIconMap: Record<string, React.FC> = {
    'socar': SocarIcon,
    'axa': AXAIcon,
    'css': CSSIcon,
    'migros': MigrosIcon,
    'coop': CoopIcon,
    'sbb': SBBIcon,
    'swisscom': SwisscomIcon,
    'postfinance': PostFinanceIcon,
    'ubs': UBSIcon,
    'shell': ShellIcon,
    'aldi': AldiIcon,
    'lidl': LidlIcon,
  };

  const lowerIconName = iconName?.toLowerCase() || '';
  
  // Check for brand icon match
  if (brandIconMap[lowerIconName]) {
    const BrandIcon = brandIconMap[lowerIconName];
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <BrandIcon />
      </div>
    );
  }
  
  // Otherwise get category icon by name
  const IconComponent = getCategoryIconByName(iconName || '');
  
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <IconComponent className="w-5 h-5" />
    </div>
  );
};

export default CategoryIcon;
