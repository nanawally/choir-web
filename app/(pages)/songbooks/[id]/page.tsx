"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listSongbooks,
  listSongs,
  listSongbookSongs,
  updateSong,
  deleteSong,
  removeSongFromSongbook,
  type Song,
  type Songbook,
  type SongbookSong,
} from "../../../lib/api";
import NavSidebar from "../../../components/NavSidebar";
import SongModal from "../../../components/songs/SongModal";
import EditSongbookModal from "../../../components/songbooks/EditSongbookModal";
import { SongsTableView } from "../../../components/songs/SongsTableView";
import { extractSuggestions } from "../../../components/songs/SongFormFields";
import { useTranslation } from "../../../lib/LanguageContext";
import { ArrowLeft } from "lucide-react";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type DeleteDialogProps = {
  songName: string;
  onRemove: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

function DeleteSongDialog({ songName, onRemove, onDelete, onCancel }: DeleteDialogProps) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 bg-overlay z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-xl shadow-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-4">{songName}</h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={onRemove}
            className="px-4 py-2 border border-border rounded text-sm hover:bg-hover-bg text-left"
          >
            {t("songbooks.removeFromSongbook")}
          </button>
          <button onClick={onDelete} className="px-4 py-2 btn-danger text-sm text-left">
            {t("songbooks.deleteFromCatalog")}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded text-sm hover:bg-hover-bg text-left"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SongbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();

  const [songbook, setSongbook] = useState<Songbook | null>(null);
  const [sbSongs, setSbSongs] = useState<SongbookSong[]>([]);
  const [catalogSongs, setCatalogSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModalOpen, setEditingModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<SongbookSong | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<SongbookSong | null>(null);

  useEffect(() => {
    Promise.all([listSongbooks(), listSongbookSongs(id), listSongs()])
      .then(([books, songs, catalog]) => {
        setSongbook(books.find((b) => b.id === id) ?? null);
        setSbSongs(songs);
        setCatalogSongs(catalog);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const defaultSort = useCallback(
    (a: SongbookSong, b: SongbookSong) => a.sortOrder - b.sortOrder,
    [],
  );

  async function handleRemoveFromSongbook(song: SongbookSong) {
    await removeSongFromSongbook(id, song.id);
    setSbSongs((prev) => prev.filter((s) => s.id !== song.id));
    setDeletingTarget(null);
  }

  async function handleDeleteFromCatalog(song: SongbookSong) {
    await deleteSong(song.id);
    setSbSongs((prev) => prev.filter((s) => s.id !== song.id));
    setCatalogSongs((prev) => prev.filter((s) => s.id !== song.id));
    setDeletingTarget(null);
  }

  async function handleSaveSong(updated: Song) {
    const { id: songId, ...fields } = updated;
    if (await updateSong(songId, fields)) {
      setSbSongs((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, ...updated } : s)),
      );
      setCatalogSongs((prev) =>
        prev.map((s) => (s.id === songId ? updated : s)),
      );
    }
  }

  const suggestions = extractSuggestions(catalogSongs);

  return (
    <div className="flex h-dvh">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-4 md:pt-8 px-4 md:px-8 min-w-0 overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col mx-auto w-full max-w-6xl overflow-hidden">
          <Link
            href="/songbooks"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4"
          >
            <ArrowLeft size={14} />
            {t("songbooks.backToSongbooks")}
          </Link>

          <div className="mb-6 text-center">
            <h1 className="text-4xl font-bold">{songbook?.name ?? "…"}</h1>
            {songbook?.date && (
              <p className="text-sm text-muted mt-1">{formatDate(songbook.date)}</p>
            )}
          </div>

          <SongsTableView
            songs={sbSongs}
            loading={loading}
            storageKey="songbook-songs-visible-columns"
            defaultSort={defaultSort}
            csvFilename={`${songbook?.name ?? "songbook"}.csv`}
            toolbarAction={
              <button
                onClick={() => setEditingModalOpen(true)}
                className="px-3 py-1.5 btn-primary text-sm font-medium"
              >
                {t("songbooks.editSongbook")}
              </button>
            }
            onRowClick={(s) => setEditingSong(s)}
            onDelete={(s) => setDeletingTarget(s)}
            noItemsMessage={t("songbooks.noSongs")}
            noMatchMessage={t("songs.noMatch")}
          />
        </div>
      </div>

      {editingModalOpen && (
        <EditSongbookModal
          songbookId={id}
          catalogSongs={catalogSongs}
          songbookSongs={sbSongs}
          onSongsChange={(updated) => {
            setSbSongs(updated);
            listSongs().then(setCatalogSongs);
          }}
          onClose={() => setEditingModalOpen(false)}
        />
      )}

      {editingSong && (
        <SongModal
          song={editingSong}
          onClose={() => setEditingSong(null)}
          onSave={handleSaveSong}
          suggestions={suggestions}
        />
      )}

      {deletingTarget && (
        <DeleteSongDialog
          songName={deletingTarget.name}
          onRemove={() => handleRemoveFromSongbook(deletingTarget)}
          onDelete={() => handleDeleteFromCatalog(deletingTarget)}
          onCancel={() => setDeletingTarget(null)}
        />
      )}
    </div>
  );
}