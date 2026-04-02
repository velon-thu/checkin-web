"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/calendar", label: "Calendar" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/72 p-1.5 shadow-[0_20px_45px_-30px_rgba(23,33,27,0.4)] backdrop-blur-xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition duration-200 ${
              isActive
                ? "bg-[linear-gradient(135deg,#1e6a4b,#143d2d)] text-white shadow-[0_14px_28px_-18px_rgba(20,61,45,0.95)]"
                : "text-zinc-600 hover:bg-white/90 hover:text-zinc-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
