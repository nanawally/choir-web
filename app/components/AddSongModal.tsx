"use client";

import { useRef, useState } from "react";
import type { Song } from "../lib/api";
import { SongFormFields, type Suggestions } from "./SongFormFields";
import { Upload, X } from "lucide-react";
import { useTranslation } from "../lib/LanguageContext";

const EMPTY_SONG: Song = {
  id: "",
  name: "",
  composer: null,
  arranger: null,
  lyricist: null,
  delning: null,
  languages: null,
  length: null,
  accompanied: null,
  instrument: null,
  year: null,
  collectionName: null,
  hasSoloists: null,
  soloistNames: null,
  hasSheetMusic: false,
  hasSheetMusicFile: false,
  lyrics: null,
};

export default function AddSongModal({
  onClose,
  onCreate,
  suggestions,
}: {
  onClose: () => void;
  onCreate: (
    fields: Omit<Song, "id" | "hasSheetMusicFile">,
    file?: File,
  ) => void;
  suggestions?: Suggestions;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Song>({ ...EMPTY_SONG });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Song>(key: K, value: Song[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { id, hasSheetMusicFile, ...fields } = form;
    await onCreate(fields, file ?? undefined);
    setSaving(false);
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
        <h2 className="text-lg font-bold mb-4">{t("songs.addSongTitle")}</h2>
        <SongFormFields form={form} set={set} suggestions={suggestions} />

        <div className="mt-4 pt-4 border-t border-dashed border-border">
          <span className="block text-xs font-medium text-muted mb-2">
            {t("songs.sheetMusicPdf")}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
          {file ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground">{file.name}</span>
              <button
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-subtle hover:text-muted"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
            >
              <Upload size={16} />
              {t("songs.choosePdf")}
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-border rounded text-sm"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 btn-primary text-sm"
          >
            {saving ? t("common.creating") : t("common.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
