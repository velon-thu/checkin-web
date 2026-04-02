"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/calendar", label: "日历" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 p-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-white hover:text-zinc-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
