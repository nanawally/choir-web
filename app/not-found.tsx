"use client";

import Link from "next/link";
import NavSidebar from "./components/NavSidebar";
import { useTranslation } from "./lib/LanguageContext";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
        <span className="text-5xl">404</span>
        <h1 className="text-xl font-semibold">{t("error.pageNotFound")}</h1>
        <p className="text-muted text-sm">{t("error.pageNotFoundDetail")}</p>
        <Link href="/" className="mt-2 text-sm text-link hover:underline">
          {t("error.goHome")}
        </Link>
      </div>
    </div>
  );
}
