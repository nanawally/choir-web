"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "../lib/api";

const NAV_ITEMS = [
  { href: "/concerts", label: "Concerts" },
  { href: "/songs", label: "Songs" },
  { href: "/chorists", label: "Chorists" },
  { href: "/voice-groups", label: "Voice Groups" },
  { href: "/base-formations", label: "Base Formations" },
];

export default function NavSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="w-48 shrink-0 border-r border-gray-200 py-8 px-4 flex flex-col min-h-screen">
      <Link href="/" className="text-lg font-bold mb-6 px-3">
        melisma
      </Link>
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded text-sm ${
              pathname === item.href
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <button
        onClick={() => {
          clearToken();
          router.push("/login");
        }}
        className="mt-auto text-sm text-gray-400 hover:text-gray-600 text-left px-3"
      >
        Log out
      </button>
    </nav>
  );
}
