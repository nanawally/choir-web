"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
  addSongToSongbook,
  removeSongFromSongbook,
  reorderSongbookSongs,
  listSongbookSongs,
  createSong,
  updateSong,
  uploadSheetMusic,
  type Song,
  type SongbookSong,
} from "../../lib/api";
import AddSongModal from "../songs/AddSongModal";
import { extractSuggestions } from "../songs/SongFormFields";
import { useTranslation } from "../../lib/LanguageContext";

type Props = {
  songbookId: string;
  catalogSongs: Song[];
  songbookSongs: SongbookSong[];
  onSongsChange: (songs: SongbookSong[]) => void;
  onClose: () => void;
};

function SortableSongbookItem({
  song,
  composer,
  onRemove,
}: {
  song: SongbookSong;
  composer: string | null;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 text-sm py-1.5 px-2 rounded hover:bg-hover-bg cursor-pointer group"
      onClick={onRemove}
      onContextMenu={(e) => {
        e.preventDefault();
        onRemove();
      }}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing select-none text-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </span>
      <span className="flex-1 min-w-0">
        <span>{song.name}</span>
        {composer && <span className="text-muted ml-1.5">— {composer}</span>}
      </span>
    </li>
  );
}

export default function EditSongbookModal({
  songbookId,
  catalogSongs,
  songbookSongs: initialSongs,
  onSongsChange,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [songs, setSongs] = useState<SongbookSong[]>(
    [...initialSongs].sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const [search, setSearch] = useState("");
  const [showAddSong, setShowAddSong] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const songbookSongIds = new Set(songs.map((s) => s.id));
  const searchLower = search.toLowerCase();
  const availableSongs = catalogSongs.filter(
    (s) =>
      !songbookSongIds.has(s.id) &&
      (s.name.toLowerCase().includes(searchLower) ||
        (s.composer ?? "").toLowerCase().includes(searchLower)),
  );

  async function handleAdd(catalogSong: Song) {
    const ok = await addSongToSongbook(songbookId, catalogSong.id);
    if (ok) {
      const refreshed = await listSongbookSongs(songbookId);
      const sorted = refreshed.sort((a, b) => a.sortOrder - b.sortOrder);
      setSongs(sorted);
      onSongsChange(sorted);
    }
  }

  async function handleRemove(songId: string) {
    await removeSongFromSongbook(songbookId, songId);
    const updated = songs.filter((s) => s.id !== songId);
    setSongs(updated);
    onSongsChange(updated);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = songs.findIndex((s) => s.id === active.id);
    const newIndex = songs.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...songs];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, songs[oldIndex]);

    const updated = reordered.map((s, i) => ({ ...s, sortOrder: i }));
    setSongs(updated);
    onSongsChange(updated);
    reorderSongbookSongs(
      songbookId,
      updated.map((s) => s.id),
    );
  }

  async function handleCreateSong(
    fields: Omit<Song, "id" | "hasSheetMusicFile">,
    file?: File,
  ) {
    const song = await createSong(fields.name.trim());
    if (!song) return;
    const { id: _id, ...updateFields } = { ...song, ...fields };
    await updateSong(song.id, updateFields);
    if (file) await uploadSheetMusic(song.id, file);
    await addSongToSongbook(songbookId, song.id);
    const refreshed = await listSongbookSongs(songbookId);
    const sorted = refreshed.sort((a, b) => a.sortOrder - b.sortOrder);
    setSongs(sorted);
    onSongsChange(sorted);
    setShowAddSong(false);
  }

  function getComposer(songId: string): string | null {
    return catalogSongs.find((s) => s.id === songId)?.composer ?? null;
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-overlay z-50 flex items-center justify-center overflow-y-auto p-4"
        onClick={onClose}
      >
        <div
          className="bg-surface rounded-xl shadow-xl w-[calc(100vw-2rem)] max-w-3xl max-h-[calc(100vh-2rem)] flex flex-col my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">{t("songbooks.editSongbook")}</h2>
              <button
                onClick={() => setShowAddSong(true)}
                className="px-3 py-1 btn-primary text-sm"
              >
                {t("songbooks.addSong")}
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 border border-border rounded text-sm hover:bg-hover-bg"
            >
              {t("common.close")}
            </button>
          </div>

          <div className="flex flex-col md:flex-row flex-1 min-h-0">
            {/* Left: Song catalog */}
            <div className="flex-1 border-b md:border-b-0 md:border-r border-border flex flex-col min-w-0">
              <div className="p-3 border-b border-border">
                <h3 className="text-xs font-medium text-muted mb-1.5">
                  {t("songbooks.songCatalog")}
                </h3>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("common.search")}
                  className="w-full border border-border rounded px-2 py-1 text-sm"
                  autoFocus
                />
              </div>
              <ul className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {availableSongs.map((s) => (
                  <li
                    key={s.id}
                    className="text-sm py-1.5 px-2 rounded hover:bg-hover-bg cursor-pointer"
                    onClick={() => handleAdd(s)}
                  >
                    <span>{s.name}</span>
                    {s.composer && (
                      <span className="text-muted ml-1.5">— {s.composer}</span>
                    )}
                  </li>
                ))}
                {availableSongs.length === 0 && (
                  <li className="text-sm text-subtle text-center py-4">
                    {search ? t("songs.noMatch") : "—"}
                  </li>
                )}
              </ul>
            </div>

            {/* Right: Current songbook songs */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-3 border-b border-border">
                <h3 className="text-xs font-medium text-muted">
                  {t("songbooks.songs")} ({songs.length})
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {songs.length === 0 ? (
                  <p className="text-sm text-subtle text-center py-4">
                    {t("songbooks.songsEmpty")}
                  </p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                  >
                    <SortableContext
                      items={songs.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className="space-y-0.5">
                        {songs.map((s) => (
                          <SortableSongbookItem
                            key={s.id}
                            song={s}
                            composer={getComposer(s.id)}
                            onRemove={() => handleRemove(s.id)}
                          />
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddSong && (
        <AddSongModal
          onClose={() => setShowAddSong(false)}
          onCreate={handleCreateSong}
          suggestions={extractSuggestions(catalogSongs)}
        />
      )}
    </>
  );
}