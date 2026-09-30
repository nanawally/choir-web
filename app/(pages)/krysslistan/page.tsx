"use client";

import NavSidebar from "../../components/NavSidebar";
import { useTranslation } from "../../lib/LanguageContext";

const SHEET_ID = process.env.NEXT_PUBLIC_KRYSSLISTAN_SHEET_ID;

export default function KrysslistanPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6 text-center">
          {t("krysslistan.title")}
        </h1>
        {SHEET_ID ? (
          <iframe
            src={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?embedded=true`}
            className="flex-1 w-full border-0 rounded-lg"
            style={{ minHeight: "70vh" }}
          />
        ) : (
          <p className="text-subtle text-sm text-center">
            {t("krysslistan.noSheet")}
          </p>
        )}
      </div>
    </div>
  );
}
