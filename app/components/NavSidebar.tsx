"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { clearToken } from "../lib/api";
import { useTranslation } from "../lib/LanguageContext";
import type { TranslationKey } from "../lib/translations";

const NAV_ITEMS: { href: string; labelKey: TranslationKey }[] = [
  { href: "/concerts", labelKey: "nav.concerts" },
  { href: "/songs", labelKey: "nav.songs" },
  { href: "/songbooks", labelKey: "nav.songbooks" },
  { href: "/chorists", labelKey: "nav.chorists" },
  { href: "/voice-groups", labelKey: "nav.voiceGroups" },
  { href: "/base-formations", labelKey: "nav.baseFormations" },
  { href: "/krysslistan", labelKey: "nav.krysslistan" },
  { href: "/term-plan", labelKey: "nav.termPlan" },
  { href: "/settings", labelKey: "nav.settings" },
];

export default function NavSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const navContent = (
    <>
      <Link
        href="/"
        className="text-lg font-bold mb-6 px-3"
        onClick={() => setOpen(false)}
      >
        melisma
      </Link>
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`px-3 py-2 rounded text-sm ${
              pathname === item.href
                ? "bg-primary-light text-primary font-medium"
                : "text-muted hover:bg-hover-bg"
            }`}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </div>
      <button
        onClick={() => {
          clearToken();
          router.push("/login");
        }}
        className="mt-auto text-sm text-subtle hover:text-muted text-left px-3"
      >
        {t("nav.logOut")}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-surface border border-border rounded-lg p-2 shadow-sm"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setOpen(false)}
          />
          <nav className="relative w-56 h-full bg-surface py-8 px-4 flex flex-col shadow-lg">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-subtle hover:text-muted"
            >
              <X size={20} />
            </button>
            {navContent}
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-48 shrink-0 border-r border-border py-8 px-4 flex-col min-h-screen">
        {navContent}
      </nav>
    </>
  );
}
