"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getToken } from "./lib/api";
import NavSidebar from "./components/NavSidebar";
import { useTranslation } from "./lib/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [hasToken] = useState(() => !!getToken());

  useEffect(() => {
    if (!hasToken) router.push("/login");
  }, [hasToken, router]);

  if (!hasToken) return null;

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-24">
        <Image
          src="/melisma-logo.png"
          alt="melisma"
          width={480}
          height={144}
          className="h-16 w-auto mb-2"
          priority
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full max-w-4xl">
          <Link
            href="/concerts"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.concerts")}</h2>
            <p className="text-sm text-muted">{t("home.manageConcerts")}</p>
          </Link>
          <Link
            href="/songs"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.songs")}</h2>
            <p className="text-sm text-muted">{t("home.manageSongs")}</p>
          </Link>
          <Link
            href="/songbooks"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.songbooks")}</h2>
            <p className="text-sm text-muted">{t("home.manageSongbooks")}</p>
          </Link>
          <Link
            href="/chorists"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.chorists")}</h2>
            <p className="text-sm text-muted">{t("home.manageChorists")}</p>
          </Link>
          <Link
            href="/voice-groups"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.voiceGroups")}</h2>
            <p className="text-sm text-muted">{t("home.manageVoiceGroups")}</p>
          </Link>
          <Link
            href="/base-formations"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.baseFormations")}</h2>
            <p className="text-sm text-muted">
              {t("home.manageBaseFormations")}
            </p>
          </Link>
          <Link
            href="/krysslistan"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.krysslistan")}</h2>
            <p className="text-sm text-muted">{t("home.attendance")}</p>
          </Link>
          <Link
            href="/term-plan"
            className="border border-border rounded-lg p-6 hover:bg-hover-bg text-center"
          >
            <h2 className="text-lg font-semibold">{t("nav.termPlan")}</h2>
            <p className="text-sm text-muted">{t("home.schedule")}</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
