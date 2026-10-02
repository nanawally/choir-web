"use client";

import { useEffect, useRef, useState } from "react";
import {
  type AudioFile,
  type SongLink,
  listAudioFiles,
  uploadAudioFile,
  deleteAudioFile,
  getAudioStreamUrl,
  listSongLinks,
  addSongLink,
  deleteSongLink,
  listVoiceGroups,
} from "../../lib/api";
import { Trash, Upload, Plus } from "lucide-react";
import { useTranslation } from "../../lib/LanguageContext";

export default function SongListeningTab({ songId }: { songId: string }) {
  const { t } = useTranslation();
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [songLinks, setSongLinks] = useState<SongLink[]>([]);
  const [voiceParts, setVoiceParts] = useState<{ id: string; name: string }[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [selectedVoicePart, setSelectedVoicePart] = useState("");
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listAudioFiles(songId).then(setAudioFiles);
    listSongLinks(songId).then(setSongLinks);
    listVoiceGroups().then((groups: { id: string; name: string; parts: { id: string; name: string }[] }[]) => {
      const parts: { id: string; name: string }[] = [];
      for (const g of groups) {
        for (const p of g.parts) {
          parts.push({ id: p.id, name: `${g.name} – ${p.name}` });
        }
      }
      setVoiceParts(parts);
    });
  }, [songId]);

  return (
    <div className="space-y-6">
      {/* Voice Part Files */}
      <div>
        <h3 className="text-sm font-semibold mb-3">{t("songs.voicePartFiles")}</h3>
        {audioFiles.length === 0 ? (
          <p className="text-sm text-subtle">{t("songs.noAudioFiles")}</p>
        ) : (
          <div className="space-y-2">
            {audioFiles.map((af) => {
              const partName = af.voicePartId
                ? voiceParts.find((vp) => vp.id === af.voicePartId)?.name ?? t("songs.general")
                : t("songs.general");
              const streamUrl = getAudioStreamUrl(af.id);
              return (
                <div key={af.id} className="flex items-center gap-3 p-2 bg-hover-bg rounded">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted block">{partName}</span>
                    <span className="text-sm truncate block">{af.fileName}</span>
                  </div>
                  <audio src={streamUrl} controls preload="none" className="h-8 w-32 sm:w-40" />
                  <button
                    onClick={async () => {
                      if (!window.confirm(t("songs.confirmDeleteAudio"))) return;
                      if (await deleteAudioFile(af.id)) {
                        setAudioFiles((prev) => prev.filter((f) => f.id !== af.id));
                      }
                    }}
                    className="text-danger hover:text-danger-hover"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <select
            value={selectedVoicePart}
            onChange={(e) => setSelectedVoicePart(e.target.value)}
            className="border border-border rounded px-2 py-1 text-sm"
          >
            <option value="">{t("songs.general")}</option>
            {voiceParts.map((vp) => (
              <option key={vp.id} value={vp.id}>{vp.name}</option>
            ))}
          </select>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingAudio(true);
              const result = await uploadAudioFile(
                songId,
                file,
                selectedVoicePart || undefined,
              );
              if (result) {
                setAudioFiles((prev) => [...prev, result]);
              }
              setUploadingAudio(false);
              if (audioInputRef.current) audioInputRef.current.value = "";
            }}
          />
          <button
            onClick={() => audioInputRef.current?.click()}
            disabled={uploadingAudio}
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground disabled:opacity-50"
          >
            <Upload size={14} />
            {uploadingAudio ? t("common.uploading") : t("songs.uploadAudio")}
          </button>
        </div>
      </div>

      {/* Links */}
      <div>
        <h3 className="text-sm font-semibold mb-3">{t("songs.links")}</h3>
        {songLinks.length === 0 ? (
          <p className="text-sm text-subtle">{t("songs.noLinks")}</p>
        ) : (
          <div className="space-y-2">
            {songLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-3 p-2 bg-hover-bg rounded">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-link hover:underline truncate flex-1 min-w-0"
                >
                  {link.label || link.url}
                </a>
                <button
                  onClick={async () => {
                    if (await deleteSongLink(link.id)) {
                      setSongLinks((prev) => prev.filter((l) => l.id !== link.id));
                    }
                  }}
                  className="text-danger hover:text-danger-hover"
                >
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <input
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            placeholder={t("songs.linkUrl")}
            className="border border-border rounded px-2 py-1 text-sm flex-1"
          />
          <input
            value={newLinkLabel}
            onChange={(e) => setNewLinkLabel(e.target.value)}
            placeholder={t("songs.linkLabel")}
            className="border border-border rounded px-2 py-1 text-sm w-32"
          />
          <button
            onClick={async () => {
              if (!newLinkUrl.trim()) return;
              const link = await addSongLink(
                songId,
                newLinkUrl.trim(),
                newLinkLabel.trim() || undefined,
              );
              if (link) {
                setSongLinks((prev) => [...prev, link]);
                setNewLinkUrl("");
                setNewLinkLabel("");
              }
            }}
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <Plus size={14} />
            {t("songs.addLink")}
          </button>
        </div>
      </div>
    </div>
  );
}
