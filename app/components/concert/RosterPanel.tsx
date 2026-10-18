"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, SquareText } from "lucide-react";
import { shortName } from "../../lib/choristName";
import { useTranslation } from "../../lib/LanguageContext";

type Chorist = { id: string; firstName: string; lastName: string; notes: string | null };

type Props = {
  chorists: Chorist[];
  allChorists: Chorist[];
  placedIds: Set<string>;
  onPlace: (id: string) => void;
  onRemove: (id: string) => void;
  hiddenIds: Set<string>;
  onToggleHidden: (ids: Set<string>) => void;
  onEditRoster: () => void;
};

export default function RosterPanel({
  chorists,
  allChorists,
  placedIds,
  onPlace,
  onRemove,
  hiddenIds,
  onToggleHidden,
  onEditRoster,
}: Props) {
  const { t } = useTranslation();
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expandedNotes) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRefs.current[expandedNotes!]?.contains(target)) return;
      setExpandedNotes(null);
      setPopoverPos(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expandedNotes]);
  const unplaced = chorists.filter((c) => !placedIds.has(c.id));
  const placed = chorists.filter((c) => placedIds.has(c.id));

  function toggleHidden(choristId: string) {
    const next = new Set(hiddenIds);
    if (next.has(choristId)) {
      next.delete(choristId);
    } else {
      next.add(choristId);
    }
    onToggleHidden(next);
  }

  const iconSize = "1.2vw";

  function notesButton(c: Chorist) {
    if (!c.notes) return null;
    return (
      <button
        ref={(el) => { buttonRefs.current[c.id] = el; }}
        onClick={(e) => {
          e.stopPropagation();
          if (expandedNotes === c.id) {
            setExpandedNotes(null);
            setPopoverPos(null);
          } else {
            const rect = buttonRefs.current[c.id]?.getBoundingClientRect();
            if (rect) setPopoverPos({ top: rect.top, left: rect.right + 8 });
            setExpandedNotes(c.id);
          }
        }}
        className={`ml-auto pl-2 ${expandedNotes === c.id ? "text-muted" : "text-subtle hover:text-muted"}`}
        title={t("chorists.notes")}
      >
        <SquareText style={{ width: iconSize, height: iconSize }} />
      </button>
    );
  }

  return (<>
    <div className="overflow-y-auto h-full">
      <h2 className="font-bold mb-3">{t("chorists.title")}</h2>
      <button
        onClick={() => onEditRoster()}
        className="m-4 px-3 py-1 btn-primary text-sm"
      >
        {t("roster.editRoster")}
      </button>

      {unplaced.length > 0 && (
        <>
          <h3 className="text-[0.9vw] text-muted font-medium mb-1">
            {t("roster.unplaced")}
          </h3>
          <ul className="space-y-1 mb-4">
            {unplaced.map((c) => (
              <li
                key={c.id}
                className="flex items-center text-[1.1vw] py-0.5 px-2 rounded hover:bg-surface-alt cursor-pointer"
                onClick={() => onPlace(c.id)}
              >
                <span className="flex-1 truncate">{shortName(c, allChorists)}</span>
                {notesButton(c)}
              </li>
            ))}
          </ul>
        </>
      )}

      {placed.length > 0 && (
        <>
          <h3 className="text-[0.9vw] text-muted font-medium mb-1">
            {t("roster.placed")}
          </h3>
          <ul className="space-y-1 mb-4">
            {placed.map((c) => (
              <li key={c.id}>
                <div
                  className={`flex items-center text-[1.1vw] py-0.5 px-2 rounded ${hiddenIds.has(c.id) ? "opacity-40" : ""}`}
                >
                  <button
                    onClick={() => toggleHidden(c.id)}
                    className="mr-1"
                    title={
                      hiddenIds.has(c.id)
                        ? t("roster.showOnGrid")
                        : t("roster.hideFromGrid")
                    }
                  >
                    {hiddenIds.has(c.id) ? (
                      <EyeOff style={{ width: iconSize, height: iconSize }} />
                    ) : (
                      <Eye style={{ width: iconSize, height: iconSize }} />
                    )}
                  </button>
                  <span
                    className="flex-1 truncate cursor-pointer hover:line-through hover:text-muted"
                    onClick={() => onRemove(c.id)}
                    title={t("roster.unplace")}
                  >
                    {shortName(c, allChorists)}
                  </span>
                  {notesButton(c)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
    {expandedNotes && popoverPos && (() => {
      const c = chorists.find((ch) => ch.id === expandedNotes);
      if (!c?.notes) return null;
      return createPortal(
        <div
          ref={popoverRef}
          className="fixed w-64 p-4 bg-surface border border-border rounded-lg shadow-lg z-50"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          <h4 className="font-medium mb-1">{t("chorists.notes")}</h4>
          <p className="text-sm text-muted whitespace-pre-wrap">{c.notes}</p>
        </div>,
        document.body,
      );
    })()}
  </>
  );
}
