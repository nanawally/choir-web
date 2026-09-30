"use client";

import { useState } from "react";
import NavSidebar from "../../components/NavSidebar";
import { useTranslation } from "../../lib/LanguageContext";

type Theme = "system" | "light" | "dark";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem("melisma-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* SSR */
  }
  return "system";
}

function applyTheme(theme: Theme) {
  localStorage.setItem("melisma-theme", theme);
  if (
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme:dark)").matches)
  ) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export default function SettingsPage() {
  const { lang, setLang, t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  function handleThemeChange(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  const activeBtn = "btn-primary";
  const inactiveBtn = "border border-border text-text-muted hover:bg-hover-bg";

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6 text-center">
          {t("settings.title")}
        </h1>

        <div className="mx-auto w-full max-w-md space-y-4">
          {/* Language */}
          <div className="border border-border rounded-lg p-4">
            <label className="block text-sm font-medium text-text-muted mb-2">
              {t("settings.language")}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLang("sv")}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  lang === "sv" ? activeBtn : inactiveBtn
                }`}
              >
                {t("settings.swedish")}
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  lang === "en" ? activeBtn : inactiveBtn
                }`}
              >
                {t("settings.english")}
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="border border-border rounded-lg p-4">
            <label className="block text-sm font-medium text-text-muted mb-2">
              {t("settings.theme")}
            </label>
            <div className="flex gap-2">
              {(["system", "light", "dark"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleThemeChange(opt)}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    theme === opt ? activeBtn : inactiveBtn
                  }`}
                >
                  {t(
                    `settings.theme${opt.charAt(0).toUpperCase()}${opt.slice(1)}` as "settings.themeSystem",
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
