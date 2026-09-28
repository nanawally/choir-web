"use client";

import NavSidebar from "../../components/NavSidebar";
import { useTranslation } from "../../lib/LanguageContext";

export default function SettingsPage() {
  const { lang, setLang, t } = useTranslation();

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col py-8 px-8">
        <h1 className="text-4xl font-bold mb-6 text-center">{t("settings.title")}</h1>

        <div className="mx-auto w-full max-w-md">
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings.language")}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLang("sv")}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  lang === "sv"
                    ? "bg-blue-500 text-white"
                    : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t("settings.swedish")}
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  lang === "en"
                    ? "bg-blue-500 text-white"
                    : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t("settings.english")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
