"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GridCanvas from "../../../components/concert/GridCanvas";
import VoiceGroupPanel from "../../../components/concert/VoiceGroupPanel";
import Link from "next/link";
import { ArrowBigLeft, CirclePile, Shapes, SquareText, UsersRound } from "lucide-react";
import { usePermissions } from "../../../lib/usePermissions";
import { shortName } from "../../../lib/choristName";
import { useTranslation } from "../../../lib/LanguageContext";
import { useBaseFormationEditor } from "../../../hooks/useBaseFormationEditor";

export default function BaseFormationEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();
  const { canEdit } = usePermissions();

  const editor = useBaseFormationEditor(id);

  // Formation name editing (pure UI state)
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Notes popover (pure UI state)
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

  const iconSize = "1.2vw";

  function notesButton(c: { id: string; notes: string | null }) {
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

  async function handleRenameSubmit() {
    await editor.handleRename(nameInput);
    setEditingName(false);
  }

  // Window size tracking
  const [windowSize, setWindowSize] = useState({ width: 1600, height: 734 });
  useEffect(() => {
    function onResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(windowSize.width);
  const updateCanvasWidth = useCallback(() => {
    if (canvasContainerRef.current) {
      setCanvasWidth(canvasContainerRef.current.clientWidth);
    }
  }, []);
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateCanvasWidth());
    ro.observe(el);
    updateCanvasWidth();
    return () => ro.disconnect();
  }, [updateCanvasWidth]);

  const canvasHeight = windowSize.height;
  const scale = canvasWidth / windowSize.width;

  const DRAWER_WIDTH = 288;
  const leftOpen = editor.showChorists;
  const rightOpen = editor.showFormationControls || editor.showVoiceGroups;
  const isArcMode = editor.rowSizes.length > 0;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Left drawer — chorist list */}
      {editor.showChorists && (
        <div className="absolute top-0 left-0 w-72 h-full bg-surface shadow-lg p-4 overflow-y-auto z-10">
          <h2 className="font-bold mb-3">{t("baseFormations.chorists")}</h2>
          <div className="space-y-1">
            {editor.sortedChorists
              .filter((c) => !editor.placedIds.has(c.id))
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center text-[1.1vw] py-0.5 px-2 rounded hover:bg-surface-alt cursor-pointer"
                  onClick={() => editor.handlePlace(c.id)}
                >
                  <span className="flex-1 truncate">{shortName(c, editor.chorists)}</span>
                  {notesButton(c)}
                </div>
              ))}
          </div>
          {editor.chorists.filter((c) => !editor.placedIds.has(c.id)).length === 0 && (
            <p className="text-subtle text-sm mt-2">{t("baseFormations.allPlaced")}</p>
          )}
          {editor.chorists.filter((c) => editor.placedIds.has(c.id)).length > 0 && (
            <>
              <h3 className="text-xs font-medium text-muted mt-4 mb-1">{t("baseFormations.placed")}</h3>
              {editor.sortedChorists
                .filter((c) => editor.placedIds.has(c.id))
                .map((c) => (
                  <div key={c.id} className="flex items-center text-[1.1vw] py-0.5 px-2 text-subtle">
                    <span className="flex-1 truncate">{shortName(c, editor.chorists)}</span>
                    {notesButton(c)}
                  </div>
                ))}
            </>
          )}
        </div>
      )}

      {/* Grid area */}
      <div
        className="absolute overflow-hidden flex"
        style={{
          top: 0,
          bottom: 0,
          left: leftOpen ? DRAWER_WIDTH : 0,
          right: rightOpen ? DRAWER_WIDTH : 0,
        }}
      >
        {/* Left toggle buttons */}
        <div className="flex flex-col gap-2 p-2 pt-4 shrink-0">
          <Link
            href="/base-formations"
            className="bg-surface rounded-lg shadow p-2 hover:bg-surface-alt text-center text-sm"
            title={t("baseFormations.backToBaseFormations")}
          >
            <ArrowBigLeft size={20} />
          </Link>
          <button
            className="bg-surface rounded-lg shadow p-2 hover:bg-surface-alt"
            onClick={() => editor.setShowChorists(!editor.showChorists)}
          >
            <UsersRound size={20} />
          </button>
        </div>

        {/* Canvas */}
        <div ref={canvasContainerRef} className="flex-1 min-w-0 overflow-hidden relative">
          {/* Formation name */}
          {editor.formationName && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 text-sm font-medium text-muted">
              {editingName ? (
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="border-b border-border-strong outline-none bg-transparent text-center"
                  autoFocus
                />
              ) : (
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => {
                    setNameInput(editor.formationName!);
                    setEditingName(true);
                  }}
                  title={t("common.clickToRename")}
                >
                  {editor.formationName}
                </span>
              )}
            </div>
          )}
          <GridCanvas
            chorists={editor.chorists}
            allChorists={editor.chorists}
            placements={editor.placements}
            setPlacements={editor.setPlacements}
            selectedIds={editor.selectedIds}
            setSelectedIds={editor.setSelectedIds}
            activeGroupId={editor.activeGroupId}
            voiceGroups={editor.voiceGroups}
            assignments={editor.assignments}
            highlightPartId={editor.highlightPartId}
            onRemove={editor.handleRemove}
            formationName={editor.formationName}
            hiddenIds={new Set()}
            rowSizes={editor.rowSizes}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            scale={scale}
            virtualWidth={windowSize.width}
            virtualHeight={windowSize.height}
            activeFormationId={null}
            onUndo={editor.undo}
            onRedo={editor.redo}
            canUndo={editor.canUndo}
            canRedo={editor.canRedo}
            autoSaveStatus={editor.autoSaveStatus}
            songName={null}
          />
        </div>

        {/* Right toggle buttons */}
        <div className="flex flex-col gap-2 p-2 pt-4 shrink-0">
          {canEdit("base_formations") && (
            <button
              className={`rounded-lg shadow p-2 hover:bg-surface-alt ${editor.showFormationControls ? "bg-primary-light" : "bg-surface"}`}
              onClick={() => { editor.setShowFormationControls(!editor.showFormationControls); editor.setShowVoiceGroups(false); }}
              title={t("formations.title")}
            >
              <CirclePile size={20} />
            </button>
          )}
          <button
            className={`rounded-lg shadow p-2 hover:bg-surface-alt ${editor.showVoiceGroups ? "bg-primary-light" : "bg-surface"}`}
            onClick={() => { editor.setShowVoiceGroups(!editor.showVoiceGroups); editor.setShowFormationControls(false); }}
            title={t("voiceGroups.title")}
          >
            <Shapes size={20} />
          </button>
        </div>
      </div>

      {/* Notes popover */}
      {expandedNotes && popoverPos && (() => {
        const c = editor.chorists.find((ch) => ch.id === expandedNotes);
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

      {/* Right drawer */}
      <div
        className={`absolute top-0 right-0 w-72 h-full bg-surface shadow-lg p-4 overflow-y-auto z-10 transition-transform duration-300 ease-in-out ${rightOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Formation controls panel */}
        {editor.showFormationControls && (
          <div className="flex flex-col gap-2">
            <h2 className="font-bold mb-1">{t("formations.title")}</h2>

            <select
              value={isArcMode ? "arc" : "grid"}
              onChange={(e) => editor.handleSetArcMode(e.target.value === "arc")}
              className="border border-border rounded px-2 py-1.5 text-sm w-fit"
            >
              <option value="arc">{t("formations.arc")}</option>
              <option value="grid">{t("formations.grid")}</option>
            </select>

            {isArcMode && (
              <div className="mt-1">
                <h4 className="text-xs font-medium mb-1 text-muted">{t("formations.arcRowsShort")}</h4>
                {editor.rowSizes.map((size, i) => (
                  <div key={i} className="flex items-center gap-1 mb-1">
                    <span className="text-xs w-12">{`${t("formations.row")} ${i + 1}:`}</span>
                    <input
                      type="number"
                      value={size}
                      min={editor.placements.filter((p) => p.gridY === i).length || 1}
                      onChange={(e) => editor.handleUpdateRowSize(i, parseInt(e.target.value) || 1)}
                      className="border border-border rounded px-1 py-0.5 text-sm w-16"
                    />
                    <button
                      onClick={() => editor.handleRemoveRow(i)}
                      className="text-danger hover:text-danger-hover text-xs"
                    >
                      X
                    </button>
                  </div>
                ))}
                <button
                  onClick={editor.handleAddRow}
                  className="text-xs text-link hover:underline"
                >
                  {t("formations.addRow")}
                </button>
              </div>
            )}

            <button
              onClick={editor.handleSave}
              disabled={editor.autoSaveStatus === "saving"}
              className="px-3 py-1.5 btn-success text-sm w-fit font-medium"
            >
              {editor.autoSaveStatus === "saving" ? t("common.saving") : t("formations.saveFormation")}
            </button>
          </div>
        )}

        {/* Voice groups panel */}
        {editor.showVoiceGroups && (
          <VoiceGroupPanel
            activeGroupId={editor.activeGroupId}
            onSelectGroup={editor.handleSelectGroup}
            voiceGroups={editor.voiceGroups}
            setVoiceGroups={editor.setVoiceGroups}
            highlightPartId={editor.highlightPartId}
            onHighlightPart={editor.setHighlightPartId}
            canEdit={canEdit("base_formations")}
          />
        )}
      </div>
    </div>
  );
}