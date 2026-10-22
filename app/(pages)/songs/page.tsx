"use client";

import { useCallback } from "react";
import { type Song } from "../../lib/api";
import SongModal from "../../components/songs/SongModal";
import NavSidebar from "../../components/NavSidebar";
import AddSongModal from "../../components/songs/AddSongModal";
import { extractSuggestions } from "../../components/songs/SongFormFields";
import { SongsTableView } from "../../components/songs/SongsTableView";
import { useSongs } from "../../hooks/useSongs";
import { useTranslation } from "../../lib/LanguageContext";
import { usePermissions } from "../../lib/usePermissions";

export default function SongsPage() {
  const {
    songs,
    loading,
    showAdd,
    setShowAdd,
    editingSong,
    setEditingSong,
    handleCreate,
    handleDelete,
    handleSave,
  } = useSongs();

  const { t } = useTranslation();
  const { canEdit, canDelete } = usePermissions();
  const suggestions = extractSuggestions(songs);
  const defaultSort = useCallback((a: Song, b: Song) => a.name.localeCompare(b.name), []);

  return (
    <div className="flex h-dvh">
      <NavSidebar />
      <div className="flex-1 min-w-0 flex flex-col pt-16 pb-4 md:pt-8 px-4 md:px-[5.56vw] overflow-hidden">
        <h1 className="text-4xl font-bold mb-6 text-center">{t("songs.title")}</h1>
        <SongsTableView
          songs={songs}
          loading={loading}
          storageKey="songs-visible-columns"
          defaultSort={defaultSort}
          csvFilename="songs.csv"
          className="w-full"
          toolbarAction={
            canEdit("songs") ? (
              <button
                onClick={() => setShowAdd(true)}
                className="px-3 py-1.5 btn-primary text-sm font-medium"
              >
                {t("songs.addSong")}
              </button>
            ) : undefined
          }
          onRowClick={(s) => setEditingSong(s)}
          onDelete={canDelete("songs") ? (s) => handleDelete(s.id) : undefined}
          noItemsMessage={t("songs.noSongs")}
          noMatchMessage={t("songs.noMatch")}
        />
        {showAdd && (
          <AddSongModal
            onClose={() => setShowAdd(false)}
            onCreate={handleCreate}
            suggestions={suggestions}
          />
        )}
        {editingSong && (
          <SongModal
            song={editingSong}
            onClose={() => setEditingSong(null)}
            onSave={handleSave}
            suggestions={suggestions}
          />
        )}
      </div>
    </div>
  );
}