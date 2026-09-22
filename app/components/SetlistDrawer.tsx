"use client";

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
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { addSongToConcert, removeSongFromConcert, reorderConcertSongs } from "../lib/api";

type Formation = { id: string; name: string };
type ConcertSong = { id: string; name: string; sortOrder: number };

type Props = {
  concertId: string;
  concertSongs: ConcertSong[];
  activeConcertSongId: string | null;
  catalogSongs: { id: string; name: string }[];
  onSelectSong: (id: string) => void;
  onSongsChange: (songs: ConcertSong[]) => void;
  getFormationsForSong: (songId: string) => Formation[];
  activeFormationId: string | null;
  onSelectFormation: (id: string) => void;
  onReorderFormations: (songId: string, newOrder: string[]) => void;
};

// Individual sortable formation item (nested under a song)
function SortableFormation({
  formation,
  isActive,
  onClick,
}: {
  formation: Formation;
  isActive: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: formation.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 text-xs py-0.5 px-1 rounded ${
        isActive ? "bg-blue-200 font-semibold" : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing select-none text-gray-400"
      >
        ≡
      </span>
      <button onClick={onClick} className="flex-1 text-left hover:underline">
        {formation.name}
      </button>
    </li>
  );
}

// Individual sortable song item
function SortableSongItem({
  song,
  isActive,
  onSelect,
  onRemove,
  children,
}: {
  song: ConcertSong;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={`flex items-center justify-between text-sm py-0.5 px-2 rounded cursor-pointer ${isActive ? "bg-blue-100 font-semibold" : "hover:bg-gray-100"}`}
        onClick={onSelect}
      >
        <span className="flex items-center gap-1">
          <span
            {...attributes}
            {...listeners}
            style={{ touchAction: "none" }}
            className="cursor-grab active:cursor-grabbing select-none text-gray-400"
            onClick={(e) => e.stopPropagation()}
          >
            ≡
          </span>
          {song.name}
        </span>
        <button
          className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          X
        </button>
      </div>
      {children}
    </li>
  );
}

export default function SetlistDrawer({
  concertId,
  concertSongs,
  activeConcertSongId,
  catalogSongs,
  onSelectSong,
  onSongsChange,
  getFormationsForSong,
  activeFormationId,
  onSelectFormation,
  onReorderFormations,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleFormationDragEnd(songId: string, formations: Formation[]) {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = formations.findIndex((f) => f.id === active.id);
      const newIndex = formations.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = [...formations];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, formations[oldIndex]);

      onReorderFormations(songId, newOrder.map((f) => f.id));
    };
  }

  function handleSongDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = concertSongs.findIndex((s) => s.id === active.id);
    const newIndex = concertSongs.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...concertSongs];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, concertSongs[oldIndex]);

    // Update sortOrder to match new positions
    const updated = reordered.map((s, i) => ({ ...s, sortOrder: i }));
    onSongsChange(updated);
    reorderConcertSongs(concertId, updated.map((s) => s.id));
  }

  return (
    <>
      <h2 className="font-bold mb-3">Setlist</h2>
      <div className="flex gap-1 mt-2">
        <select
          id="add-song-select"
          className="flex-1 border border-gray-300 rounded px-1 py-0.5 text-sm"
        >
          {catalogSongs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          className="px-2 py-0.5 bg-blue-500 text-white rounded text-sm"
          onClick={async () => {
            const select = document.getElementById(
              "add-song-select",
            ) as HTMLSelectElement;
            const songId = select.value;
            if (!songId) return;
            const added = await addSongToConcert(concertId, songId);
            onSongsChange([...concertSongs, added]);
          }}
        >
          Add
        </button>
      </div>
      <div className="mt-3" />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSongDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={concertSongs.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-1 mb-4">
            {concertSongs.map((s) => {
              const songFormations = getFormationsForSong(s.id);
              return (
                <SortableSongItem
                  key={s.id}
                  song={s}
                  isActive={activeConcertSongId === s.id}
                  onSelect={() => onSelectSong(s.id)}
                  onRemove={async () => {
                    await removeSongFromConcert(concertId, s.id);
                    onSongsChange(concertSongs.filter((cs) => cs.id !== s.id));
                  }}
                >
                  {songFormations.length > 0 && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleFormationDragEnd(s.id, songFormations)}
                      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                    >
                      <SortableContext
                        items={songFormations.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <ul className="flex flex-col gap-0.5 mt-1 ml-4 mb-1">
                          {songFormations.map((f) => (
                            <SortableFormation
                              key={f.id}
                              formation={f}
                              isActive={activeFormationId === f.id}
                              onClick={() => {
                                if (activeConcertSongId !== s.id) onSelectSong(s.id);
                                onSelectFormation(f.id);
                              }}
                            />
                          ))}
                        </ul>
                      </SortableContext>
                    </DndContext>
                  )}
                </SortableSongItem>
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}
