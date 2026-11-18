"use client";

import Link from "next/link";
import NavSidebar from "./components/NavSidebar";
import { useTranslation } from "./lib/LanguageContext";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
        <span className="text-5xl">500</span>
        <h1 className="text-xl font-semibold">{t("error.somethingWentWrong")}</h1>
        <p className="text-muted text-sm">{t("error.somethingWentWrongDetail")}</p>
        <div className="flex gap-3 mt-2">
          <button onClick={reset} className="text-sm text-link hover:underline">
            {t("error.tryAgain")}
          </button>
          <Link href="/" className="text-sm text-link hover:underline">
            {t("error.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
