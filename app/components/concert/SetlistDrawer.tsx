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
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "../../lib/LanguageContext";

type Formation = { id: string; name: string };
type ConcertSong = { id: string; name: string; sortOrder: number };

type Props = {
  concertSongs: ConcertSong[];
  activeConcertSongId: string | null;
  onSelectSong: (id: string) => void;
  onEditSetlist: () => void;
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
        isActive
          ? "bg-primary-light font-semibold"
          : "bg-surface-alt text-muted"
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing select-none text-subtle"
      >
        <GripVertical size={14} />
      </span>
      <button onClick={onClick} className="flex-1 text-left hover:underline">
        {formation.name}
      </button>
    </li>
  );
}

export default function SetlistDrawer({
  concertSongs,
  activeConcertSongId,
  onSelectSong,
  onEditSetlist,
  getFormationsForSong,
  activeFormationId,
  onSelectFormation,
  onReorderFormations,
}: Props) {
  const { t } = useTranslation();
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

      onReorderFormations(
        songId,
        newOrder.map((f) => f.id),
      );
    };
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">{t("concerts.setlist")}</h2>
        <button
          onClick={onEditSetlist}
          className="px-2 py-0.5 btn-primary text-xs"
        >
          {t("common.edit")}
        </button>
      </div>
      <ul className="space-y-1 mb-4">
        {concertSongs.map((s) => {
          const songFormations = getFormationsForSong(s.id);
          return (
            <li key={s.id}>
              <div
                className={`text-sm py-0.5 px-2 rounded cursor-pointer ${activeConcertSongId === s.id ? "bg-primary-light font-semibold" : "hover:bg-surface-alt"}`}
                onClick={() => onSelectSong(s.id)}
              >
                {s.name}
              </div>
              {songFormations.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleFormationDragEnd(s.id, songFormations)}
                  modifiers={[
                    restrictToVerticalAxis,
                    restrictToParentElement,
                  ]}
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
                            if (activeConcertSongId !== s.id)
                              onSelectSong(s.id);
                            onSelectFormation(f.id);
                          }}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function SetlistNavButtons({
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  className,
}: {
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  className?: string;
}) {
  return (
    <div
      className={
        className ?? "flex justify-center gap-2 py-2 border-t border-border"
      }
    >
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="px-3 py-1 bg-surface border border-border rounded text-sm hover:bg-hover-bg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ArrowLeft size={16} />
      </button>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="px-3 py-1 bg-surface border border-border rounded text-sm hover:bg-hover-bg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
