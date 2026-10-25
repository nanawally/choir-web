"use client";

import { useTranslation } from "../lib/LanguageContext";

export default function AccessDenied() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
      <span className="text-5xl">🔒</span>
      <h1 className="text-xl font-semibold">{t("error.accessDenied")}</h1>
      <p className="text-muted text-sm">{t("error.accessDeniedDetail")}</p>
    </div>
  );
}
