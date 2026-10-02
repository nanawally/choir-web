"use client";

import { useRef, useState } from "react";
import { uploadSheetMusic, deleteSheetMusic } from "../../lib/api";
import dynamic from "next/dynamic";
import { FileText, Trash, Upload } from "lucide-react";
import { useTranslation } from "../../lib/LanguageContext";

const PdfViewer = dynamic(() => import("../PdfViewer"), { ssr: false });

export default function SongSheetMusicTab({
  songId,
  hasSheetMusicFile,
  pdfUrl,
  onViewPdf,
  onSheetMusicChange,
}: {
  songId: string;
  hasSheetMusicFile: boolean;
  pdfUrl: string | null;
  onViewPdf: () => void;
  onSheetMusicChange: (hasFile: boolean) => void;
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const result = await uploadSheetMusic(songId, file);
    if (result) onSheetMusicChange(true);
    setUploading(false);
  }

  async function handleDelete() {
    if (!window.confirm(t("songs.confirmDeleteSheet"))) return;
    if (await deleteSheetMusic(songId)) onSheetMusicChange(false);
  }

  if (hasSheetMusicFile) {
    return (
      <div>
        {pdfUrl && (
          <div className="mb-3">
            <PdfViewer url={pdfUrl} />
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={onViewPdf}
            className="flex items-center gap-1.5 text-sm text-link hover:text-link-light-text"
          >
            <FileText size={16} />
            {t("songs.viewFullPdf")}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-sm text-danger hover:text-danger-hover"
          >
            <Trash size={14} />
            {t("common.delete")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground disabled:opacity-50"
      >
        <Upload size={16} />
        {uploading ? t("common.uploading") : t("songs.uploadPdf")}
      </button>
    </div>
  );
}