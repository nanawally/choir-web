"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import GridCanvas from "../../../components/GridCanvas";
import VoiceGroupPanel from "../../../components/VoiceGroupPanel";
import Link from "next/link";
import {
  apiFetch,
  getAssignments,
  loadFormation,
  listVoiceGroups,
  renameFormation,
  savePlacements,
  updateRowSizes,
} from "../../../lib/api";

const CELL_SIZE = 50;
const WIDTH = 800;
const HEIGHT = 600;

type Chorist = { id: string; name: string };
type Placement = { choristId: string; gridX: number; gridY: number };

export default function BaseFormationEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formationName, setFormationName] = useState<string | null>(null);
  const [rowSizes, setRowSizes] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Voice groups
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<
    { choristId: string; voicePartId: string }[]
  >([]);
  const [highlightPartId, setHighlightPartId] = useState<string | null>(null);
  const [voiceGroups, setVoiceGroups] = useState<
    {
      id: string;
      name: string;
      isStandard: boolean;
      parts: { id: string; name: string; color: string; shape: string }[];
    }[]
  >([]);

  // Panels
  const [showChorists, setShowChorists] = useState(false);
  const [showVoiceGroups, setShowVoiceGroups] = useState(false);

  // Formation name editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const DRAWER_WIDTH = 288;

  useEffect(() => {
    apiFetch("/chorists")
      .then((res) => res.json())
      .then(setChorists);
  }, []);

  useEffect(() => {
    listVoiceGroups().then(setVoiceGroups);
  }, []);

  useEffect(() => {
    loadFormation(id).then((data: any) => {
      if (data) {
        setFormationName(data.name);
        setPlacements(
          data.placements.map((p: any) => ({
            choristId: p.choristId,
            gridX: p.gridX,
            gridY: p.gridY,
          })),
        );
        setRowSizes(JSON.parse(data.rowSizes || "[]"));
      }
    });
  }, [id]);

  useEffect(() => {
    if (activeGroupId) {
      getAssignments(activeGroupId).then(setAssignments);
    }
  }, [activeGroupId]);

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

  const placedIds = new Set(placements.map((p) => p.choristId));

  function handleSelectGroup(groupId: string | null) {
    setActiveGroupId(groupId);
    setHighlightPartId(null);
    if (!groupId) setAssignments([]);
  }

  function handlePlace(choristId: string) {
    const occupied = new Set(placements.map((p) => `${p.gridX},${p.gridY}`));
    for (let gridY = 1; gridY < HEIGHT / CELL_SIZE; gridY++) {
      for (let gridX = 1; gridX < WIDTH / CELL_SIZE; gridX++) {
        if (!occupied.has(`${gridX},${gridY}`)) {
          setPlacements([...placements, { choristId, gridX, gridY }]);
          return;
        }
      }
    }
  }

  function handleRemove(choristId: string) {
    setPlacements(placements.filter((p) => p.choristId !== choristId));
  }

  async function handleSave() {
    setSaving(true);
    await savePlacements(
      id,
      placements.map((p) => ({
        choristId: p.choristId,
        gridX: p.gridX,
        gridY: p.gridY,
      })),
    );
    setSaving(false);
  }

  async function handleRename() {
    if (!nameInput.trim()) return;
    const trimmed = nameInput.trim();
    if (trimmed === formationName) {
      setEditingName(false);
      return;
    }
    await renameFormation(id, trimmed);
    setFormationName(trimmed);
    setEditingName(false);
  }

  const isArcMode = rowSizes.length > 0;

  function handleSetArcMode(arc: boolean) {
    if (arc && rowSizes.length === 0) {
      const next = [10];
      setRowSizes(next);
      updateRowSizes(id, next);
    } else if (!arc) {
      setRowSizes([]);
      updateRowSizes(id, []);
    }
  }

  function handleClampPlacements(rowIndex: number, newSize: number) {
    const onRow = placements.filter((p) => p.gridY === rowIndex);
    const notOnRow = placements.filter((p) => p.gridY !== rowIndex);
    const valid = onRow.filter((p) => p.gridX < newSize);
    const overflow = onRow.filter((p) => p.gridX >= newSize);
    const taken = new Set(valid.map((p) => p.gridX));
    const clamped = overflow.map((p) => {
      for (let x = newSize - 1; x >= 0; x--) {
        if (!taken.has(x)) {
          taken.add(x);
          return { ...p, gridX: x };
        }
      }
      return p;
    });
    setPlacements([...notOnRow, ...valid, ...clamped]);
  }

  const leftOpen = showChorists;
  const rightOpen = showVoiceGroups;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Left drawer — chorist list */}
      {showChorists && (
        <div className="absolute top-0 left-0 w-72 h-full bg-white shadow-lg p-4 overflow-y-auto z-10">
          <h2 className="font-bold mb-3">Chorists</h2>
          <div className="space-y-1">
            {chorists
              .filter((c) => !placedIds.has(c.id))
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => handlePlace(c.id)}
                >
                  <span>{c.name}</span>
                  <span className="text-gray-400 text-xs">+</span>
                </div>
              ))}
          </div>
          {chorists.filter((c) => !placedIds.has(c.id)).length === 0 && (
            <p className="text-gray-400 text-sm mt-2">All chorists placed.</p>
          )}
          {chorists.filter((c) => placedIds.has(c.id)).length > 0 && (
            <>
              <h3 className="text-xs font-medium text-gray-500 mt-4 mb-1">
                Placed
              </h3>
              {chorists
                .filter((c) => placedIds.has(c.id))
                .map((c) => (
                  <div
                    key={c.id}
                    className="text-sm py-0.5 px-2 text-gray-400"
                  >
                    {c.name}
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
            className="bg-white rounded-lg shadow p-2 hover:bg-gray-100 text-center text-sm"
            title="Back to base formations"
          >
            &larr;
          </Link>
          <button
            className="bg-white rounded-lg shadow p-2 hover:bg-gray-100"
            onClick={() => setShowChorists(!showChorists)}
          >
            👥
          </button>
        </div>

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          className="flex-1 min-w-0 overflow-hidden relative"
        >
          {/* Formation name */}
          {formationName && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 text-sm font-medium text-gray-500">
              {editingName ? (
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="border-b border-gray-400 outline-none bg-transparent text-center"
                  autoFocus
                />
              ) : (
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => {
                    setNameInput(formationName);
                    setEditingName(true);
                  }}
                  title="Click to rename"
                >
                  {formationName}
                </span>
              )}
            </div>
          )}
          <GridCanvas
            chorists={chorists}
            placements={placements}
            setPlacements={setPlacements}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            activeGroupId={activeGroupId}
            voiceGroups={voiceGroups}
            assignments={assignments}
            highlightPartId={highlightPartId}
            onRemove={handleRemove}
            formationName={formationName}
            hiddenIds={new Set()}
            rowSizes={rowSizes}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            scale={scale}
            virtualWidth={windowSize.width}
            virtualHeight={windowSize.height}
          />
        </div>

        {/* Right toggle button */}
        <div className="flex flex-col gap-2 p-2 pt-4 shrink-0">
          <button
            className="bg-white rounded-lg shadow p-2 hover:bg-gray-100"
            onClick={() => setShowVoiceGroups(!showVoiceGroups)}
          >
            🎵
          </button>
        </div>
      </div>

      {/* Right drawer — voice groups + controls */}
      {showVoiceGroups && (
        <div className="absolute top-0 right-0 w-72 h-full bg-white shadow-lg p-4 overflow-y-auto z-10">
          {/* Formation controls */}
          <div className="flex flex-col gap-2 p-2 border-b border-gray-200 mb-4">
            <h2 className="font-bold mb-1">Formation</h2>

            {/* Layout mode */}
            <select
              value={isArcMode ? "arc" : "grid"}
              onChange={(e) => handleSetArcMode(e.target.value === "arc")}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-fit"
            >
              <option value="arc">Arc</option>
              <option value="grid">Grid</option>
            </select>

            {/* Arc rows */}
            {isArcMode && (
              <div className="mt-1">
                <h4 className="text-xs font-medium mb-1 text-gray-500">
                  Arc rows
                </h4>
                {rowSizes.map((size, i) => (
                  <div key={i} className="flex items-center gap-1 mb-1">
                    <span className="text-xs w-12">Row {i + 1}:</span>
                    <input
                      type="number"
                      value={size}
                      min={
                        placements.filter((p) => p.gridY === i).length || 1
                      }
                      onChange={(e) => {
                        const next = [...rowSizes];
                        next[i] = parseInt(e.target.value) || 1;
                        setRowSizes(next);
                        handleClampPlacements(i, next[i]);
                        updateRowSizes(id, next);
                      }}
                      className="border border-gray-300 rounded px-1 py-0.5 text-sm w-16"
                    />
                    <button
                      onClick={() => {
                        const next = rowSizes.filter((_, j) => j !== i);
                        setRowSizes(next);
                        updateRowSizes(id, next);
                      }}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      X
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const next = [...rowSizes, 10];
                    setRowSizes(next);
                    updateRowSizes(id, next);
                  }}
                  className="text-xs text-blue-500 hover:underline"
                >
                  + Add row
                </button>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-green-500 text-white rounded text-sm w-fit font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save formation"}
            </button>
          </div>

          <VoiceGroupPanel
            activeGroupId={activeGroupId}
            onSelectGroup={handleSelectGroup}
            voiceGroups={voiceGroups}
            setVoiceGroups={setVoiceGroups}
            highlightPartId={highlightPartId}
            onHighlightPart={setHighlightPartId}
          />
        </div>
      )}
    </div>
  );
}
