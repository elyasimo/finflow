import React from 'react';
import { 
  FoodIcon, 
  TransportIcon, 
  ShoppingIcon, 
  EntertainmentIcon,
  HealthIcon,
  EducationIcon,
  HomeIcon,
  UtilitiesIcon,
  SalaryIcon,
  InvestmentIcon,
  TravelIcon,
  OtherIcon
} from './category-icons';
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

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = '' }) => {
  const iconMap: Record<string, React.FC> = {
    // Category Icons
    'food': FoodIcon,
    'transport': TransportIcon,
    'shopping': ShoppingIcon,
    'entertainment': EntertainmentIcon,
    'health': HealthIcon,
    'education': EducationIcon,
    'home': HomeIcon,
    'utilities': UtilitiesIcon,
    'salary': SalaryIcon,
    'investment': InvestmentIcon,
    'travel': TravelIcon,
    'other': OtherIcon,
    
    // Swiss Brand Icons
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

  const IconComponent = iconMap[iconName?.toLowerCase()] || OtherIcon;

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <IconComponent />
    </div>
  );
};

export default CategoryIcon;
