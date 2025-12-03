'use client';

import { useState } from 'react';
import { Tag, Plus, Pencil, Trash2, Search, ChevronLeft, MoreVertical, X } from 'lucide-react';
import MobilePageWrapper from './mobile-page-wrapper';
import MobileBottomNav from './mobile-bottom-nav';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Category {
  id: string;
  name: string;
  icon?: string;
  transactionCount?: number;
}

interface MobileCategoriesProps {
  categories: Category[];
  onAddCategory: () => void;
  onEditCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
}

// Category color palette
const categoryColors = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-green-500 to-green-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-cyan-500 to-cyan-600',
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600',
  'from-rose-500 to-rose-600',
  'from-amber-500 to-amber-600',
];

export default function MobileCategories({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: MobileCategoriesProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get color for category (based on index)
  const getCategoryColor = (index: number) => {
    return categoryColors[index % categoryColors.length];
  };

  // Get icon for category
  const getCategoryIcon = (name: string) => {
    const iconMap: Record<string, string> = {
      food: '🍽️',
      groceries: '🛒',
      transport: '🚗',
      shopping: '🛍️',
      entertainment: '🎬',
      health: '💊',
      bills: '📄',
      salary: '💰',
      travel: '✈️',
      education: '📚',
      sports: '⚽',
      home: '🏠',
      utilities: '💡',
      insurance: '🛡️',
      subscriptions: '📱',
    };
    
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return '📁';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1629] pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a2332] px-4 pt-12 pb-4 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('categories')}
            </h1>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {categories.length} Kategorien
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Kategorien suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-[#232e40] rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {searchQuery ? 'Keine Ergebnisse' : 'Keine Kategorien'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Fügen Sie Ihre erste Kategorie hinzu
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCategories.map((category, index) => (
              <div
                key={category.id}
                className="relative bg-white dark:bg-[#1a2332] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800"
              >
                {/* Category Card */}
                <button
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                  className="w-full p-4 text-left active:scale-[0.98] transition-transform"
                >
                  {/* Icon with gradient background */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryColor(index)} flex items-center justify-center mb-3`}>
                    <span className="text-2xl">{getCategoryIcon(category.name)}</span>
                  </div>
                  
                  {/* Category Name */}
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                    {category.name}
                  </h3>
                  
                  {/* Transaction Count */}
                  {category.transactionCount !== undefined && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.transactionCount} {t('transactions') || 'Transaktionen'}
                    </p>
                  )}
                </button>

                {/* Action Menu */}
                {selectedCategory === category.id && (
                  <div className="absolute top-2 right-2 bg-white dark:bg-[#232e40] rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-10">
                    <button
                      onClick={() => {
                        onEditCategory(category.id);
                        setSelectedCategory(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 w-full text-left"
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{t('edit')}</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeleteCategory(category.id);
                        setSelectedCategory(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 w-full text-left"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">{t('delete')}</span>
                    </button>
                  </div>
                )}

                {/* More Options Button */}
                <button
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                  className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onAddCategory}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Overlay to close menu */}
      {selectedCategory && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setSelectedCategory(null)}
        />
      )}

      {/* Bottom Navigation */}
      <MobileBottomNav fixed />
    </div>
  );
}
