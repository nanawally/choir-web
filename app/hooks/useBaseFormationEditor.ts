import { useEffect, useRef, useState } from "react";
import {
  apiFetch,
  getAssignments,
  listVoiceGroups,
  loadFormation,
  renameFormation,
  savePlacements,
  updateRowSizes,
} from "../lib/api";
import { sortChoristsByVoicePart } from "../lib/voiceGroupSort";

const CELL_SIZE = 50;
const WIDTH = 800;
const HEIGHT = 600;

type Chorist = { id: string; firstName: string; lastName: string; notes: string | null };
type Placement = { choristId: string; gridX: number; gridY: number };

export function useBaseFormationEditor(formationId: string) {
  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [placements, setPlacementsInternal] = useState<Placement[]>([]);
  const [pastPlacements, setPastPlacements] = useState<Placement[][]>([]);
  const [futurePlacements, setFuturePlacements] = useState<Placement[][]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formationName, setFormationName] = useState<string | null>(null);
  const [rowSizes, setRowSizes] = useState<number[]>([]);

  // Voice groups
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<{ choristId: string; voicePartId: string }[]>([]);
  const [highlightPartId, setHighlightPartId] = useState<string | null>(null);
  const [voiceGroups, setVoiceGroups] = useState<
    { id: string; name: string; isStandard: boolean; parts: { id: string; name: string; color: string; shape: string }[] }[]
  >([]);
  const [fourPartAssignments, setFourPartAssignments] = useState<{ choristId: string; voicePartId: string }[]>([]);

  // Panels
  const [showChorists, setShowChorists] = useState(false);
  const [showFormationControls, setShowFormationControls] = useState(false);
  const [showVoiceGroups, setShowVoiceGroups] = useState(false);

  // Auto-save
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    apiFetch("/chorists").then((res) => res.json()).then(setChorists);
  }, []);

  useEffect(() => {
    listVoiceGroups().then((groups) => {
      setVoiceGroups(groups);
      const fourPart = groups.find(
        (g: { name: string }) => g.name.includes("4-part") || g.name.includes("4-stäm"),
      );
      if (fourPart) getAssignments(fourPart.id).then(setFourPartAssignments);
    });
  }, []);

  useEffect(() => {
    isSyncingRef.current = true;
    loadFormation(formationId).then((data) => {
      if (data) {
        setFormationName(data.name);
        setPastPlacements([]);
        setFuturePlacements([]);
        setPlacementsInternal(
          data.placements.map((p: Placement) => ({ choristId: p.choristId, gridX: p.gridX, gridY: p.gridY })),
        );
        setRowSizes(JSON.parse(data.rowSizes || "[]"));
      } else {
        isSyncingRef.current = false;
      }
    });
  }, [formationId]);

  useEffect(() => {
    if (activeGroupId) {
      getAssignments(activeGroupId).then(setAssignments);
    }
  }, [activeGroupId]);

  // Auto-save placements 500ms after the last change
  useEffect(() => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("idle");

    const capturedPlacements = placements;
    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      await savePlacements(
        formationId,
        capturedPlacements.map((p) => ({ choristId: p.choristId, gridX: p.gridX, gridY: p.gridY })),
      );
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [placements]); // eslint-disable-line react-hooks/exhaustive-deps

  // History-aware placement setter — use for all user-initiated changes
  function setPlacements(newPlacements: Placement[]) {
    setPastPlacements((prev) => [...prev.slice(-49), placements]);
    setFuturePlacements([]);
    setPlacementsInternal(newPlacements);
  }

  function undo() {
    if (pastPlacements.length === 0) return;
    const prev = pastPlacements[pastPlacements.length - 1];
    setFuturePlacements((f) => [placements, ...f.slice(0, 49)]);
    setPastPlacements((p) => p.slice(0, -1));
    setPlacementsInternal(prev);
  }

  function redo() {
    if (futurePlacements.length === 0) return;
    const next = futurePlacements[0];
    setPastPlacements((p) => [...p.slice(-49), placements]);
    setFuturePlacements((f) => f.slice(1));
    setPlacementsInternal(next);
  }

  function handleSelectGroup(groupId: string | null) {
    setActiveGroupId(groupId);
    setHighlightPartId(null);
    if (!groupId) setAssignments([]);
  }

  function handlePlace(choristId: string) {
    const occupied = new Set(placements.map((p) => `${p.gridX},${p.gridY}`));
    if (rowSizes.length > 0) {
      for (let gridY = 0; gridY < rowSizes.length; gridY++) {
        for (let gridX = 0; gridX < rowSizes[gridY]; gridX++) {
          if (!occupied.has(`${gridX},${gridY}`)) {
            setPlacements([...placements, { choristId, gridX, gridY }]);
            return;
          }
        }
      }
    } else {
      for (let gridY = 1; gridY < HEIGHT / CELL_SIZE; gridY++) {
        for (let gridX = 1; gridX < WIDTH / CELL_SIZE; gridX++) {
          if (!occupied.has(`${gridX},${gridY}`)) {
            setPlacements([...placements, { choristId, gridX, gridY }]);
            return;
          }
        }
      }
    }
  }

  function handleRemove(choristId: string) {
    setPlacements(placements.filter((p) => p.choristId !== choristId));
  }

  async function handleSave() {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setAutoSaveStatus("saving");
    await savePlacements(
      formationId,
      placements.map((p) => ({ choristId: p.choristId, gridX: p.gridX, gridY: p.gridY })),
    );
    setAutoSaveStatus("saved");
    setTimeout(() => setAutoSaveStatus("idle"), 2000);
  }

  async function handleRename(newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === formationName) return;
    await renameFormation(formationId, trimmed);
    setFormationName(trimmed);
  }

  function handleSetArcMode(arc: boolean) {
    if (arc && rowSizes.length === 0) {
      const next = [10];
      setRowSizes(next);
      updateRowSizes(formationId, next);
    } else if (!arc) {
      setRowSizes([]);
      updateRowSizes(formationId, []);
    }
  }

  function handleUpdateRowSize(index: number, newSize: number) {
    const next = [...rowSizes];
    next[index] = newSize;
    setRowSizes(next);
    handleClampPlacements(index, newSize);
    updateRowSizes(formationId, next);
  }

  function handleAddRow() {
    const next = [...rowSizes, 10];
    setRowSizes(next);
    updateRowSizes(formationId, next);
  }

  function handleRemoveRow(index: number) {
    const next = rowSizes.filter((_, j) => j !== index);
    setRowSizes(next);
    updateRowSizes(formationId, next);
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
    setPlacementsInternal([...notOnRow, ...valid, ...clamped]);
  }

  const placedIds = new Set(placements.map((p) => p.choristId));
  const fourPartGroup = voiceGroups.find(
    (g) => g.name.includes("4-part") || g.name.includes("4-stäm"),
  );
  const sortedChorists = sortChoristsByVoicePart(chorists, fourPartGroup, fourPartAssignments);

  return {
    // State
    chorists,
    sortedChorists,
    placements,
    placedIds,
    selectedIds,
    formationName,
    rowSizes,
    activeGroupId,
    assignments,
    highlightPartId,
    voiceGroups,
    showChorists,
    showFormationControls,
    showVoiceGroups,
    autoSaveStatus,

    // Undo/redo
    canUndo: pastPlacements.length > 0,
    canRedo: futurePlacements.length > 0,
    undo,
    redo,

    // Setters
    setPlacements,
    setSelectedIds,
    setVoiceGroups,
    setShowChorists,
    setShowFormationControls,
    setShowVoiceGroups,
    setHighlightPartId,

    // Handlers
    handleSelectGroup,
    handlePlace,
    handleRemove,
    handleSave,
    handleRename,
    handleSetArcMode,
    handleUpdateRowSize,
    handleAddRow,
    handleRemoveRow,
  };
}
