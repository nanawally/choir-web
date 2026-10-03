"use client";

import { useEffect, useState } from "react";
import { SquarePen } from "lucide-react";
import { type Song, getSheetMusicUrl, getToken } from "../../lib/api";
import SongInfoTab from "./SongInfoTab";
import SongSheetMusicTab from "./SongSheetMusicTab";
import SongLyricsTab from "./SongLyricsTab";
import SongListeningTab from "./SongListeningTab";
import { SongFormFields, type Suggestions } from "./SongFormFields";
import { useTranslation } from "../../lib/LanguageContext";

export default function SongModal({
  song,
  onClose,
  onSave,
  suggestions,
}: {
  song: Song;
  onClose: () => void;
  onSave: (updated: Song) => void;
  suggestions: Suggestions;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState<Song>({ ...song });
  const [form, setForm] = useState<Song>({ ...song });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "sheet" | "lyrics" | "listening">("info");

  useEffect(() => {
    if (!current.hasSheetMusicFile) return;
    let revoked = false;
    const url = getSheetMusicUrl(current.id);
    const token = getToken();
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob && !revoked) setPdfUrl(URL.createObjectURL(blob));
      });
    return () => {
      revoked = true;
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [current.id, current.hasSheetMusicFile]);

  function handleViewPdf() {
    const url = getSheetMusicUrl(current.id);
    const token = getToken();
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      });
  }

  function set<K extends keyof Song>(key: K, value: Song[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) return;
    onSave(form);
    setCurrent({ ...form });
    setEditing(false);
  }

  function handleCancel() {
    setForm({ ...current });
    setEditing(false);
  }

  function handleSheetMusicChange(hasFile: boolean) {
    setCurrent((c) => ({ ...c, hasSheetMusicFile: hasFile, hasSheetMusic: hasFile || c.hasSheetMusic }));
    setForm((f) => ({ ...f, hasSheetMusicFile: hasFile, hasSheetMusic: hasFile || f.hasSheetMusic }));
  }

  if (editing) {
    return (
      <div
        className="fixed inset-0 bg-overlay flex items-center justify-center z-50 overflow-y-auto p-4"
        onClick={onClose}
      >
        <div
          className="bg-surface rounded-xl shadow-xl w-[calc(100vw-2rem)] max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto p-6 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold mb-4">{t("songs.editSong")}</h2>
          <SongFormFields form={form} set={set} suggestions={suggestions} />

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-1.5 border border-border rounded text-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 btn-primary text-sm"
            >
              {t("common.save")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-overlay flex items-center justify-center z-50 overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl w-[calc(100vw-2rem)] max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">{current.name}</h2>
            {current.composer && (
              <p className="text-sm text-muted">{current.composer}</p>
            )}
          </div>
          <button
            onClick={() => {
              setForm({ ...current });
              setEditing(true);
            }}
            className="text-subtle hover:text-muted"
            title={t("common.edit")}
          >
            <SquarePen size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-4 overflow-x-auto">
          {(["info", "sheet", "lyrics", "listening"] as const).map((t2) => {
            const label =
              t2 === "info" ? t("songs.tabInfo") :
              t2 === "sheet" ? t("songs.sheetMusicTitle") :
              t2 === "lyrics" ? t("songs.lyrics") :
              t("songs.tabListening");
            return (
              <button
                key={t2}
                onClick={() => setTab(t2)}
                className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === t2
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === "info" && (
          <SongInfoTab song={current} pdfUrl={pdfUrl} onViewPdf={handleViewPdf} />
        )}
        {tab === "sheet" && (
          <SongSheetMusicTab
            songId={current.id}
            hasSheetMusicFile={current.hasSheetMusicFile}
            pdfUrl={pdfUrl}
            onViewPdf={handleViewPdf}
            onSheetMusicChange={handleSheetMusicChange}
          />
        )}
        {tab === "lyrics" && <SongLyricsTab lyrics={current.lyrics} />}
        {tab === "listening" && <SongListeningTab songId={current.id} />}
      </div>
    </div>
  );
}