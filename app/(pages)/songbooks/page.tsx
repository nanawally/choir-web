"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  listSongbooks,
  createSongbook,
  updateSongbook,
  deleteSongbook,
  duplicateSongbook,
  uploadSongbookImage,
  getSongbookImageUrl,
  deleteSongbookImage,
  getToken,
} from "../../lib/api";
import type { Songbook } from "../../lib/api";
import Link from "next/link";
import NavSidebar from "../../components/NavSidebar";
import { useTranslation } from "../../lib/LanguageContext";
import { ClefTreble, Pin, Upload, Trash } from "lucide-react";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function SongbooksPage() {
  const [songbooks, setSongbooks] = useState<Songbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    listSongbooks()
      .then(async (data) => {
        setSongbooks(data);
        setLoading(false);
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const withImages = await Promise.all(
          data.map(async (sb) => {
            if (!sb.imageUrl) return sb;
            try {
              const res = await fetch(getSongbookImageUrl(sb.id), { headers });
              if (!res.ok) return { ...sb, imageUrl: null };
              const blob = await res.blob();
              return { ...sb, imageUrl: URL.createObjectURL(blob) };
            } catch {
              return { ...sb, imageUrl: null };
            }
          }),
        );
        setSongbooks(withImages);
      })
      .catch(() => setLoading(false));
  }, []);

  // Pinned first, then by date desc, then by name
  const sorted = [...songbooks].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.name.localeCompare(b.name);
  });

  async function handleCreate() {
    if (!newName.trim()) return;
    const sb = await createSongbook(newName.trim(), newDate || null, newIsPinned);
    if (sb) {
      setSongbooks([...songbooks, sb]);
      setNewName("");
      setNewDate("");
      setNewIsPinned(false);
      setShowAdd(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    const sb = songbooks.find((s) => s.id === id);
    if (await updateSongbook(id, editName.trim(), editDate || null, sb?.isPinned ?? false)) {
      setSongbooks(
        songbooks.map((s) =>
          s.id === id ? { ...s, name: editName.trim(), date: editDate || null } : s,
        ),
      );
    }
    setEditingId(null);
  }

  async function handleTogglePin(id: string) {
    const sb = songbooks.find((s) => s.id === id);
    if (!sb) return;
    if (await updateSongbook(id, sb.name, sb.date, !sb.isPinned)) {
      setSongbooks(songbooks.map((s) => s.id === id ? { ...s, isPinned: !s.isPinned } : s));
    }
  }

  async function handleDelete(id: string) {
    const sb = songbooks.find((s) => s.id === id);
    if (!window.confirm(t("songbooks.confirmDelete").replace("{name}", sb?.name ?? ""))) return;
    if (await deleteSongbook(id)) {
      setSongbooks(songbooks.filter((s) => s.id !== id));
    }
  }

  async function handleDuplicate(id: string) {
    const original = songbooks.find((s) => s.id === id);
    const name = window.prompt(t("songbooks.nameForCopy"), (original?.name ?? "") + " (copy)");
    if (!name) return;
    const sb = await duplicateSongbook(id, name);
    if (sb) {
      if (sb.imageUrl) {
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(getSongbookImageUrl(sb.id), { headers });
        const blob = res.ok ? await res.blob() : null;
        sb.imageUrl = blob ? URL.createObjectURL(blob) : null;
      }
      setSongbooks([...songbooks, sb]);
    }
  }

  async function handleImageUpload(songbookId: string, file: File) {
    if (!file.type.startsWith("image/")) {
      window.alert(t("songbooks.invalidImageType"));
      return;
    }
    setUploading(true);
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 1200,
      maxSizeMB: 0.5,
      useWebWorker: true,
    });
    const ok = await uploadSongbookImage(songbookId, compressed);
    if (ok) {
      const token = getToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(getSongbookImageUrl(songbookId), { headers });
      const blob = res.ok ? await res.blob() : null;
      const blobUrl = blob ? URL.createObjectURL(blob) : null;
      setSongbooks(songbooks.map((s) => s.id === songbookId ? { ...s, imageUrl: blobUrl } : s));
    }
    setUploading(false);
  }

  async function handleImageDelete(songbookId: string) {
    if (!window.confirm(t("songbooks.confirmDeleteImage"))) return;
    if (await deleteSongbookImage(songbookId)) {
      setSongbooks(songbooks.map((s) => s.id === songbookId ? { ...s, imageUrl: null } : s));
    }
  }

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6 text-center">{t("songbooks.title")}</h1>

        <div className="mx-auto w-full max-w-4xl">
          <div className="flex justify-end mb-6">
            <button onClick={() => setShowAdd(true)} className="px-3 py-2 btn-primary text-sm font-medium">
              {t("songbooks.newSongbook")}
            </button>
          </div>

          {showAdd && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6 p-3 border border-border rounded-lg bg-hover-bg">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setShowAdd(false);
                    setNewName("");
                    setNewDate("");
                  }
                }}
                placeholder={t("songbooks.songbookName")}
                className="border border-border rounded px-2 py-1 text-sm flex-1"
                autoFocus
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="border border-border rounded px-2 py-1 text-sm w-full sm:w-auto"
              />
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsPinned}
                  onChange={(e) => setNewIsPinned(e.target.checked)}
                />
                {t("songbooks.pinned")}
              </label>
              <button onClick={handleCreate} className="px-3 py-1 btn-primary text-sm">
                {t("common.create")}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewName(""); setNewDate(""); setNewIsPinned(false); }}
                className="px-3 py-1 border border-border rounded text-sm"
              >
                {t("common.cancel")}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((sb) => (
              <div
                key={sb.id}
                className="border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative"
              >
                {/* Pin toggle — top-left */}
                <button
                  onClick={(e) => { e.preventDefault(); handleTogglePin(sb.id); }}
                  className="absolute top-2 left-2 z-10 bg-surface/90 border border-border rounded p-1 shadow-sm"
                  title={t("songbooks.pinned")}
                >
                  <Pin size={12} className={sb.isPinned ? "text-primary" : "text-muted"} />
                </button>

                {/* Image area */}
                <Link href={`/songbooks/${sb.id}`}>
                  <div className="relative aspect-4/3 bg-surface-alt flex items-center justify-center">
                    {sb.imageUrl ? (
                      <img src={sb.imageUrl} alt={sb.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <ClefTreble size={40} className="text-subtle" />
                    )}
                  </div>
                </Link>

                {/* Info area */}
                <div className="p-3">
                  {editingId === sb.id ? (
                    <div className="flex flex-col gap-1">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate(sb.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="border border-border rounded px-2 py-0.5 text-sm font-semibold"
                        autoFocus
                      />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="border border-border rounded px-2 py-0.5 text-sm"
                      />
                      <div className="flex gap-1 mt-1 justify-between">
                        <div className="flex gap-1">
                          <button onClick={() => handleUpdate(sb.id)} className="px-2 py-0.5 btn-primary text-xs">
                            {t("common.save")}
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-2 py-0.5 border border-border rounded text-xs">
                            {t("common.cancel")}
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(sb.id, file);
                              e.target.value = "";
                            }}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-1 px-2 py-0.5 border border-border rounded text-xs hover:bg-hover-bg"
                          >
                            <Upload size={12} />
                            {uploading ? t("common.uploading") : t("songbooks.uploadImage")}
                          </button>
                          {sb.imageUrl && (
                            <button
                              onClick={() => handleImageDelete(sb.id)}
                              className="flex items-center gap-1 px-2 py-0.5 btn-danger text-xs"
                            >
                              <Trash size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link href={`/songbooks/${sb.id}`}>
                        <h2 className="font-semibold text-sm hover:text-link text-center">{sb.name}</h2>
                      </Link>
                      {sb.date && (
                        <p className="text-xs text-subtle mt-0.5 text-center">{formatDate(sb.date)}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Action buttons — visible on hover */}
                {editingId !== sb.id && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingId(sb.id); setEditName(sb.name); setEditDate(sb.date || ""); }}
                      className="px-1.5 py-0.5 bg-surface/90 border border-border rounded text-xs shadow-sm"
                      title={t("common.edit")}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => handleDuplicate(sb.id)}
                      className="px-1.5 py-0.5 bg-surface/90 border border-border rounded text-xs shadow-sm"
                      title={t("common.duplicate")}
                    >
                      {t("common.copy")}
                    </button>
                    <button
                      onClick={() => handleDelete(sb.id)}
                      className="px-1.5 py-0.5 btn-danger text-xs shadow-sm"
                      title={t("common.delete")}
                    >
                      X
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!loading && songbooks.length === 0 && !showAdd && (
            <p className="text-subtle text-sm text-center mt-8">{t("songbooks.noSongbooks")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
