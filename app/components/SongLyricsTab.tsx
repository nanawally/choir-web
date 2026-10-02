"use client";

import { useTranslation } from "../lib/LanguageContext";

export default function SongLyricsTab({ lyrics }: { lyrics: string | null }) {
  const { t } = useTranslation();

  if (lyrics) {
    return (
      <pre className="text-sm whitespace-pre-wrap font-sans">{lyrics}</pre>
    );
  }

  return <p className="text-sm text-subtle">{t("songs.noLyrics")}</p>;
}