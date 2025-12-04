"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { Bell, ChevronRight, Languages } from "lucide-react"
import Profile01 from "./profile-01"
import Link from "next/link"
import { ThemeToggle } from "../theme-toggle"
import { useState } from "react"
import { useCurrency } from './CurrencyContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface BreadcrumbItem {
  label: string
  href?: string
}

// User interface
interface User {
  id: string;
  email: string;
  fullName?: string;
}

interface TopNavProps {
  user?: User;
}

export default function TopNav({ user }: TopNavProps) {
  const { currency: selectedCurrency, updateCurrencyInBackend } = useCurrency();
  const { language, setLanguage } = useLanguage();

  const currencyOptions = [
    { code: 'USD', label: 'USD' },
    { code: 'EUR', label: 'EUR' },
    { code: 'CHF', label: 'CHF' },
    { code: 'MAD', label: 'MAD' },
    { code: 'BTC', label: 'BTC' },
    { code: 'ETH', label: 'ETH' },
    { code: 'SOL', label: 'SOL' },
  ];

  // Handler für Currency-Änderung
  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    try {
      await updateCurrencyInBackend(newCurrency);
      // Currency wurde erfolgreich aktualisiert und React Query Cache invalidiert
    } catch (error) {
      alert('Failed to update currency. Please try again.');
    }
  };

  const languageOptions = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  ];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Financial Manager", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
  ]

  return (
    <nav className="px-3 sm:px-6 flex items-center justify-between bg-white dark:bg-[#1a2332] border-b border-gray-200 dark:border-[#232e40] h-full">
      <div className="font-medium text-sm hidden sm:flex items-center space-x-1 truncate max-w-[300px]">
        {breadcrumbs.map((item, index) => (
          <div key={item.label} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 mx-1" />}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
        <select
          value={language}
          onChange={e => setLanguage(e.target.value as any)}
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232e40] text-gray-900 dark:text-gray-100 px-2 py-1 focus:outline-none text-sm"
        >
          {languageOptions.map(opt => (
            <option key={opt.code} value={opt.code}>
              {opt.flag} {opt.label}
            </option>
          ))}
        </select>

        <select
          value={selectedCurrency}
          onChange={handleCurrencyChange}
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232e40] text-gray-900 dark:text-gray-100 px-2 py-1 focus:outline-none text-sm"
        >
          {currencyOptions.map(opt => (
            <option key={opt.code} value={opt.code}>{opt.label}</option>
          ))}
        </select>

        <button
          type="button"
          className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#232e40] rounded-full transition-colors"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Image
              src="https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-01-n0x8HFv8EUetf9z6ht0wScJKoTHqf8.png"
              alt="User avatar"
              width={28}
              height={28}
              className="rounded-full ring-2 ring-gray-200 dark:ring-[#2B2B30] sm:w-8 sm:h-8 cursor-pointer"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[280px] sm:w-80 bg-white dark:bg-[#0f1623] border border-gray-200 dark:border-[#232e40] rounded-lg shadow-lg p-0"
          >
            <Profile01 
              avatar="https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-01-n0x8HFv8EUetf9z6ht0wScJKoTHqf8.png" 
              name={user?.fullName || user?.email?.split('@')[0] || 'User'}
              role={user?.email || 'user@example.com'}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
