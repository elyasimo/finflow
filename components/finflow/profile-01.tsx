import { LogOut, MoveUpRight, Settings, CreditCard, FileText } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface MenuItem {
  label: string
  value?: string
  href: string
  icon?: React.ReactNode
  external?: boolean
}

interface Profile01Props {
  name: string
  role: string
  avatar: string
  subscription?: string
}

const defaultProfile = {
  name: "Eugene An",
  role: "Prompt Engineer",
  avatar: "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-02-albo9B0tWOSLXCVZh9rX9KFxXIVWMr.png",
  subscription: "Free Trial",
} satisfies Required<Profile01Props>

export default function Profile01({
  name = defaultProfile.name,
  role = defaultProfile.role,
  avatar = defaultProfile.avatar,
  subscription = defaultProfile.subscription,
}: Partial<Profile01Props> = defaultProfile) {
  const router = useRouter();
  const { logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    logout();
  };

  const menuItems: MenuItem[] = [
    {
      label: t('settings'),
      href: "/settings",
      icon: <Settings className="w-4 h-4" />,
      external: false,
    },
  ];

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-lg">
        <div className="relative px-4 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative shrink-0">
              <Image
                src={avatar}
                alt={name}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0f1623]" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">{name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{role}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-[#232e40] my-3" />

          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#1a2332] rounded-lg transition-colors duration-200"
              >
                <div className="text-gray-600 dark:text-gray-400">{item.icon}</div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</span>
                {item.external && <MoveUpRight className="w-4 h-4 ml-auto text-gray-400" />}
              </Link>
            ))}

            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-[#232e40] my-2" />

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
