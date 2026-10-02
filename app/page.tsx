"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "./lib/api";
import NavSidebar from "./components/NavSidebar";
import { useTranslation } from "./lib/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-24">
        <h1 className="text-4xl font-bold">melisma</h1>
        <div className="flex flex-col mt-8 md:flex-row gap-4">
          <Link
            href="/concerts"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg flex-1 text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.concerts")}</h2>
            <p className="text-sm text-muted">{t("home.manageConcerts")}</p>
          </Link>
          <Link
            href="/songs"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg flex-1 text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.songs")}</h2>
            <p className="text-sm text-muted">{t("home.manageSongs")}</p>
          </Link>
          <Link
            href="/chorists"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg flex-1 text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.chorists")}</h2>
            <p className="text-sm text-muted">{t("home.manageChorists")}</p>
          </Link>
          <Link
            href="/voice-groups"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg flex-1 text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.voiceGroups")}</h2>
            <p className="text-sm text-muted">{t("home.manageVoiceGroups")}</p>
          </Link>
          <Link
            href="/base-formations"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg flex-1 text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.baseFormations")}</h2>
            <p className="text-sm text-muted">
              {t("home.manageBaseFormations")}
            </p>
          </Link>
          <Link
            href="/krysslistan"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg flex-1 text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.krysslistan")}</h2>
            <p className="text-sm text-muted">{t("home.attendance")}</p>
          </Link>
          <Link
            href="/term-plan"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg flex-1 text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.termPlan")}</h2>
            <p className="text-sm text-muted">{t("home.schedule")}</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
