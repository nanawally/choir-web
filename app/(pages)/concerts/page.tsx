"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  listConcerts,
  createConcert,
  updateConcert,
  deleteConcert,
  duplicateConcert,
  uploadConcertImage,
  getConcertImageUrl,
  deleteConcertImage,
  getToken,
} from "../../lib/api";
import Link from "next/link";
import NavSidebar from "../../components/NavSidebar";
import { useTranslation } from "../../lib/LanguageContext";
import { ClefTreble, Upload, Trash } from "lucide-react";

type Concert = {
  id: string;
  name: string;
  date: string | null;
  imageUrl: string | null;
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function ConcertsPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    listConcerts()
      .then(async (data: Concert[]) => {
        setConcerts(data);
        setLoading(false);
        // Fetch images with auth and convert to blob URLs
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const withImages = await Promise.all(
          data.map(async (c) => {
            if (!c.imageUrl) return c;
            try {
              const res = await fetch(getConcertImageUrl(c.id), { headers });
              if (!res.ok) return { ...c, imageUrl: null };
              const blob = await res.blob();
              return { ...c, imageUrl: URL.createObjectURL(blob) };
            } catch {
              return { ...c, imageUrl: null };
            }
          }),
        );
        setConcerts(withImages);
      })
      .catch(() => setLoading(false));
  }, []);

  // Sort by date descending (latest first), nulls last
  const sorted = [...concerts].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.name.localeCompare(b.name);
  });

  async function handleCreate() {
    if (!newName.trim()) return;
    const concert = await createConcert(newName.trim(), newDate || null);
    if (concert) {
      setConcerts([...concerts, concert]);
      setNewName("");
      setNewDate("");
      setShowAdd(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    if (await updateConcert(id, editName.trim(), editDate || null)) {
      setConcerts(
        concerts.map((c) =>
          c.id === id
            ? { ...c, name: editName.trim(), date: editDate || null }
            : c,
        ),
      );
    }
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    const concert = concerts.find((c) => c.id === id);
    if (!window.confirm(t("concerts.confirmDelete").replace("{name}", concert?.name ?? ""))) return;
    if (await deleteConcert(id)) {
      setConcerts(concerts.filter((c) => c.id !== id));
    }
  }

  async function handleDuplicate(id: string) {
    const original = concerts.find((c) => c.id === id);
    const name = window.prompt(
      t("concerts.nameForCopy"),
      (original?.name ?? "") + " (copy)",
    );
    if (!name) return;
    const concert = await duplicateConcert(id, name);
    if (concert) {
      if (concert.imageUrl) {
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(getConcertImageUrl(concert.id), { headers });
        const blob = res.ok ? await res.blob() : null;
        concert.imageUrl = blob ? URL.createObjectURL(blob) : null;
      }
      setConcerts([...concerts, concert]);
    }
  }

  async function handleImageUpload(concertId: string, file: File) {
    if (!file.type.startsWith("image/")) {
      window.alert(t("concerts.invalidImageType"));
      return;
    }
    setUploading(true);
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 1200,
      maxSizeMB: 0.5,
      useWebWorker: true,
    });
    const ok = await uploadConcertImage(concertId, compressed);
    if (ok) {
      const token = getToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(getConcertImageUrl(concertId), { headers });
      const blob = res.ok ? await res.blob() : null;
      const blobUrl = blob ? URL.createObjectURL(blob) : null;
      setConcerts(
        concerts.map((c) =>
          c.id === concertId ? { ...c, imageUrl: blobUrl } : c,
        ),
      );
    }
    setUploading(false);
  }

  async function handleImageDelete(concertId: string) {
    if (!window.confirm(t("concerts.confirmDeleteImage"))) return;
    if (await deleteConcertImage(concertId)) {
      setConcerts(
        concerts.map((c) =>
          c.id === concertId ? { ...c, imageUrl: null } : c,
        ),
      );
    }
  }

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6 text-center">
          {t("concerts.title")}
        </h1>

        <div className="mx-auto w-full max-w-4xl">
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowAdd(true)}
              className="px-3 py-2 btn-primary text-sm font-medium"
            >
              {t("concerts.newConcert")}
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
                placeholder={t("concerts.concertName")}
                className="border border-border rounded px-2 py-1 text-sm flex-1"
                autoFocus
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="border border-border rounded px-2 py-1 text-sm w-full sm:w-auto"
              />
              <button
                onClick={handleCreate}
                className="px-3 py-1 btn-primary text-sm"
              >
                {t("common.create")}
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewName("");
                  setNewDate("");
                }}
                className="px-3 py-1 border border-border rounded text-sm"
              >
                {t("common.cancel")}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((c) => (
              <div
                key={c.id}
                className="border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative"
              >
                {/* Image area */}
                <Link href={`/concerts/${c.id}`}>
                  <div className="relative aspect-4/3 bg-surface-alt flex items-center justify-center">
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <ClefTreble size={40} className="text-subtle" />
                    )}
                  </div>
                </Link>

                {/* Info area */}
                <div className="p-3">
                  {editingId === c.id ? (
                    <div className="flex flex-col gap-1">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate(c.id);
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
                          <button
                            onClick={() => handleUpdate(c.id)}
                            className="px-2 py-0.5 btn-primary text-xs"
                          >
                            {t("common.save")}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-0.5 border border-border rounded text-xs"
                          >
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
                              if (file) handleImageUpload(c.id, file);
                              e.target.value = "";
                            }}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-1 px-2 py-0.5 border border-border rounded text-xs hover:bg-hover-bg"
                          >
                            <Upload size={12} />
                            {uploading ? t("common.uploading") : t("concerts.uploadImage")}
                          </button>
                          {c.imageUrl && (
                            <button
                              onClick={() => handleImageDelete(c.id)}
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
                      <Link href={`/concerts/${c.id}`}>
                        <h2 className="font-semibold text-sm hover:text-link text-center">
                          {c.name}
                        </h2>
                      </Link>
                      {c.date && (
                        <p className="text-xs text-subtle mt-0.5 text-center">
                          {formatDate(c.date)}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Action buttons — visible on hover */}
                {editingId !== c.id && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(c.id);
                        setEditName(c.name);
                        setEditDate(c.date || "");
                      }}
                      className="px-1.5 py-0.5 bg-surface/90 border border-border rounded text-xs shadow-sm"
                      title={t("common.edit")}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => handleDuplicate(c.id)}
                      className="px-1.5 py-0.5 bg-surface/90 border border-border rounded text-xs shadow-sm"
                      title={t("common.duplicate")}
                    >
                      {t("common.copy")}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
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

          {!loading && concerts.length === 0 && !showAdd && (
            <p className="text-subtle text-sm text-center mt-8">
              {t("concerts.noConcerts")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
