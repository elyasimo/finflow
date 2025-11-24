import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
}

interface NavigationBarProps {
  items: NavigationItem[];
}

export function NavigationBar({ items }: NavigationBarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-2 mb-6 border-b">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-3 py-2 text-sm transition-colors hover:text-primary",
            pathname === item.href
              ? "border-b-2 border-primary font-medium text-primary"
              : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
} 