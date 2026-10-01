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
  addSongToConcert,
  removeSongFromConcert,
  reorderConcertSongs,
} from "../lib/api";
import { useTranslation } from "../lib/LanguageContext";

type CatalogSong = { id: string; name: string; composer: string | null };
type ConcertSong = { id: string; name: string; sortOrder: number };

type Props = {
  concertId: string;
  catalogSongs: CatalogSong[];
  concertSongs: ConcertSong[];
  onSongsChange: (songs: ConcertSong[]) => void;
  onClose: () => void;
};

function SortableSetlistItem({
  song,
  composer,
  onRemove,
}: {
  song: ConcertSong;
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
        {composer && (
          <span className="text-muted ml-1.5">— {composer}</span>
        )}
      </span>
    </li>
  );
}

export default function EditSetlistModal({
  concertId,
  catalogSongs,
  concertSongs: initialSongs,
  onSongsChange,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [songs, setSongs] = useState<ConcertSong[]>(initialSongs);
  const [search, setSearch] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Map concertSong.name back to catalog to find the original songId
  // ConcertSongs have their own id (the join entity), and .name is the song name
  // We need the catalog songId to add, and the concertSong.id to remove

  // Songs in the setlist — their names (a song can appear multiple times)
  const setlistSongNames = new Set(songs.map((s) => s.name));

  // Filter catalog: show songs not already in setlist, matching search
  const searchLower = search.toLowerCase();
  const availableSongs = catalogSongs.filter(
    (s) =>
      !setlistSongNames.has(s.name) &&
      (s.name.toLowerCase().includes(searchLower) ||
        (s.composer ?? "").toLowerCase().includes(searchLower)),
  );

  async function handleAdd(catalogSong: CatalogSong) {
    const added = await addSongToConcert(concertId, catalogSong.id);
    if (added) {
      const updated = [...songs, added];
      setSongs(updated);
      onSongsChange(updated);
    }
  }

  async function handleRemove(concertSongId: string) {
    await removeSongFromConcert(concertId, concertSongId);
    const updated = songs.filter((s) => s.id !== concertSongId);
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
    reorderConcertSongs(
      concertId,
      updated.map((s) => s.id),
    );
  }

  // Find composer for a concert song by matching name back to catalog
  function getComposer(songName: string): string | null {
    return catalogSongs.find((s) => s.name === songName)?.composer ?? null;
  }

  return (
    <div
      className="fixed inset-0 bg-overlay z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">{t("concerts.editSetlist")}</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 border border-border rounded text-sm hover:bg-hover-bg"
          >
            {t("common.close")}
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: Song catalog */}
          <div className="flex-1 border-r border-border flex flex-col min-w-0">
            <div className="p-3 border-b border-border">
              <h3 className="text-xs font-medium text-muted mb-1.5">
                {t("concerts.songCatalog")}
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

          {/* Right: Current setlist */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-3 border-b border-border">
              <h3 className="text-xs font-medium text-muted">
                {t("concerts.setlist")} ({songs.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {songs.length === 0 ? (
                <p className="text-sm text-subtle text-center py-4">
                  {t("concerts.setlistEmpty")}
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
                        <SortableSetlistItem
                          key={s.id}
                          song={s}
                          composer={getComposer(s.name)}
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
  );
}
