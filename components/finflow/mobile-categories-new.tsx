"use client"

import { useState } from "react"
import { 
  Tag, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  ChevronLeft, 
  X,
  Utensils,
  Home,
  Car,
  Smartphone,
  Heart,
  Banknote,
  MoreHorizontal,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import MobileBottomNav from "./mobile-bottom-nav"

interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  transactionCount?: number
}

interface MobileCategoriesNewProps {
  categories: Category[]
  onAddCategory: () => void
  onEditCategory: (id: string) => void
  onDeleteCategory: (id: string) => void
}

// Reduced, modern category set with flat icons
const defaultCategories = [
  { id: 'food', name: 'Essen & Lebensmittel', icon: Utensils, color: 'from-orange-400 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-500' },
  { id: 'housing', name: 'Miete & Wohnen', icon: Home, color: 'from-indigo-400 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-500' },
  { id: 'transport', name: 'Transport', icon: Car, color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-500' },
  { id: 'subscriptions', name: 'Abonnements', icon: Smartphone, color: 'from-violet-400 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', iconColor: 'text-violet-500' },
  { id: 'health', name: 'Gesundheit', icon: Heart, color: 'from-rose-400 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-500' },
  { id: 'income', name: 'Gehalt/Einnahmen', icon: Banknote, color: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500' },
  { id: 'other', name: 'Sonstiges', icon: MoreHorizontal, color: 'from-gray-400 to-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/30', iconColor: 'text-gray-500' },
]

// Icon mapping for dynamic categories
const iconMap: Record<string, typeof Utensils> = {
  food: Utensils,
  essen: Utensils,
  lebensmittel: Utensils,
  groceries: Utensils,
  restaurant: Utensils,
  housing: Home,
  miete: Home,
  wohnen: Home,
  rent: Home,
  transport: Car,
  car: Car,
  auto: Car,
  subscriptions: Smartphone,
  abonnements: Smartphone,
  phone: Smartphone,
  health: Heart,
  gesundheit: Heart,
  healthcare: Heart,
  income: Banknote,
  gehalt: Banknote,
  salary: Banknote,
  einnahmen: Banknote,
}

const colorMap: Record<string, { bg: string; iconColor: string }> = {
  food: { bg: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-500' },
  essen: { bg: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-500' },
  housing: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-500' },
  miete: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-500' },
  transport: { bg: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-500' },
  subscriptions: { bg: 'bg-violet-50 dark:bg-violet-950/30', iconColor: 'text-violet-500' },
  health: { bg: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-500' },
  income: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500' },
  gehalt: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500' },
}

export default function MobileCategoriesNew({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: MobileCategoriesNewProps) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get icon and color for a category
  const getCategoryStyle = (name: string, index: number) => {
    const lowerName = name.toLowerCase()
    
    // Try to find a matching icon
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        const colors = colorMap[key] || { bg: 'bg-gray-50 dark:bg-gray-900/30', iconColor: 'text-gray-500' }
        return { icon, ...colors }
      }
    }
    
    // Default fallback with rotating colors
    const defaultColors = [
      { bg: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-500' },
      { bg: 'bg-purple-50 dark:bg-purple-950/30', iconColor: 'text-purple-500' },
      { bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500' },
      { bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-500' },
      { bg: 'bg-pink-50 dark:bg-pink-950/30', iconColor: 'text-pink-500' },
      { bg: 'bg-cyan-50 dark:bg-cyan-950/30', iconColor: 'text-cyan-500' },
    ]
    const colors = defaultColors[index % defaultColors.length]
    return { icon: Tag, ...colors }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a2332] px-6 pt-16 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="w-11 h-11 rounded-full bg-gray-50 dark:bg-[#232e40] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('categories')}
            </h1>
          </div>
          <span className="text-sm text-gray-400 px-3 py-1.5 bg-gray-50 dark:bg-[#232e40] rounded-full">
            {categories.length} Kategorien
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Kategorien suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Default Categories Info */}
      <div className="px-6 py-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Standard-Kategorien</p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {defaultCategories.map((cat) => {
            const Icon = cat.icon
            return (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-[#1a2332] shadow-sm flex-shrink-0"
              >
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", cat.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", cat.iconColor)} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {cat.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Categories List */}
      <div className="px-6 py-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Ihre Kategorien</p>
        
        {filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2332] rounded-3xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'Keine Ergebnisse' : 'Keine Kategorien'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery 
                ? 'Versuchen Sie einen anderen Suchbegriff'
                : 'Erstellen Sie Ihre erste benutzerdefinierte Kategorie'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={onAddCategory}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30"
              >
                <Plus className="w-5 h-5" />
                Kategorie erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCategories.map((category, index) => {
              const style = getCategoryStyle(category.name, index)
              const Icon = style.icon
              
              return (
                <div
                  key={category.id}
                  className="relative bg-white dark:bg-[#1a2332] rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )}
                    className="w-full flex items-center gap-4 p-4 text-left active:bg-gray-50 dark:active:bg-[#1e2940] transition-colors"
                  >
                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      style.bg
                    )}>
                      <Icon className={cn("w-5 h-5", style.iconColor)} />
                    </div>
                    
                    {/* Name & Count */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {category.name}
                      </h3>
                      {category.transactionCount !== undefined && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {category.transactionCount} Transaktionen
                        </p>
                      )}
                    </div>
                    
                    {/* Menu Indicator */}
                    <MoreHorizontal className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                  </button>

                  {/* Action Menu */}
                  {selectedCategory === category.id && (
                    <div className="border-t border-gray-100 dark:border-gray-800 flex">
                      <button
                        onClick={() => {
                          onEditCategory(category.id)
                          setSelectedCategory(null)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#232e40]"
                      >
                        <Pencil className="w-4 h-4" />
                        Bearbeiten
                      </button>
                      <div className="w-px bg-gray-100 dark:bg-gray-800" />
                      <button
                        onClick={() => {
                          onDeleteCategory(category.id)
                          setSelectedCategory(null)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-36" />
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onAddCategory}
        className="fixed bottom-28 right-6 w-16 h-16 bg-blue-500 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center z-20 active:scale-95 transition-transform hover:bg-blue-600"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Overlay to close menu */}
      {selectedCategory && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setSelectedCategory(null)}
        />
      )}

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
