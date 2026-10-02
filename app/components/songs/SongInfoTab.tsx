"use client";

import { useEffect, useState } from "react";
import type { Song } from "../../lib/api";
import { listSongConcerts } from "../../lib/api";
import dynamic from "next/dynamic";
import { useTranslation } from "../../lib/LanguageContext";

const PdfPreview = dynamic(() => import("../PdfPreview"), { ssr: false });

export default function SongInfoTab({
  song,
  pdfUrl,
  onViewPdf,
}: {
  song: Song;
  pdfUrl: string | null;
  onViewPdf: () => void;
}) {
  const { t } = useTranslation();
  const [concerts, setConcerts] = useState<{ id: string; name: string }[]>([]);
  const [showAllConcerts, setShowAllConcerts] = useState(false);

  useEffect(() => {
    listSongConcerts(song.id).then(setConcerts);
  }, [song.id]);

  const visibleConcerts = showAllConcerts ? concerts : concerts.slice(0, 3);

  return (
    <>
      <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-6">
        <DetailCell label={t("songs.arranger")} value={song.arranger ?? "—"} />
        <DetailCell label={t("songs.lyricist")} value={song.lyricist ?? "—"} />
        <DetailCell label={t("songs.delning")} value={song.delning ?? "—"} />
        <DetailCell label={t("songs.languages")} value={song.languages ?? "—"} />
        <DetailCell label={t("songs.length")} value={song.length ?? "—"} />
        <DetailCell label={t("songs.year")} value={song.year?.toString() ?? "—"} />
        <DetailCell
          label={t("songs.sheetMusic")}
          value={song.hasSheetMusicFile ? t("common.yes") : t("common.no")}
        />
        <DetailCell label={t("songs.collection")} value={song.collectionName ?? "—"} />
        <BooleanDetail
          label={t("songs.accompanied")}
          flag={song.accompanied}
          details={song.instrument}
        />
        <BooleanDetail
          label={t("songs.soloists")}
          flag={song.hasSoloists}
          details={song.soloistNames}
        />
        {concerts.length > 0 && (
          <div>
            <span className="block text-xs text-muted mb-0.5">
              {t("songs.usedIn")}
            </span>
            <ul className="text-sm text-foreground space-y-0.5">
              {visibleConcerts.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
            {concerts.length > 3 && (
              <button
                onClick={() => setShowAllConcerts(!showAllConcerts)}
                className="text-xs text-link hover:underline mt-1"
              >
                {showAllConcerts
                  ? t("common.showLess")
                  : `${concerts.length - 3} ${t("common.showMore")}`}
              </button>
            )}
          </div>
        )}
      </div>
      {song.hasSheetMusicFile && pdfUrl && (
        <div className="mt-2">
          <PdfPreview url={pdfUrl} onClick={onViewPdf} />
        </div>
      )}
    </>
  );
}

function BooleanDetail({
  label,
  flag,
  details,
}: {
  label: string;
  flag: boolean | null;
  details: string | null;
}) {
  const { t } = useTranslation();
  if (flag == null) return <DetailCell label={label} value="—" />;
  if (!flag) return <DetailCell label={label} value={t("common.no")} />;
  const items = details
    ? details
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return (
    <div>
      <span className="block text-xs text-muted mb-0.5">{label}</span>
      <span className="text-sm">{t("common.yes")}</span>
      {items.length > 0 && (
        <ul className="mt-1 ml-4 list-disc text-sm text-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs text-muted mb-0.5">{label}</span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
}
