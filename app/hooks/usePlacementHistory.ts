import { useEffect, useRef, useState } from "react";
import { savePlacements } from "../lib/api";
import type { Placement } from "../lib/editorTypes";

type Options = {
  formationId: string | null;
  // Called after a successful save — use for extra post-save work (e.g. cache updates)
  onAfterSave?: (placements: Placement[], formationId: string) => Promise<void>;
};

export type PlacementHistory = ReturnType<typeof usePlacementHistory>;

export function usePlacementHistory({ formationId, onAfterSave }: Options) {
  const [placements, setPlacementsInternal] = useState<Placement[]>([]);
  const [pastPlacements, setPastPlacements] = useState<Placement[][]>([]);
  const [futurePlacements, setFuturePlacements] = useState<Placement[][]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set to true before syncing placements from the server to suppress the next autosave trigger
  const isSyncingRef = useRef(false);
  // False until the first syncPlacements call — prevents autosave from firing before server data arrives
  const isInitializedRef = useRef(false);
  // Stable refs for use inside timer callbacks and saveImmediately
  const latestPlacementsRef = useRef(placements);
  const latestFormationIdRef = useRef(formationId);
  const onAfterSaveRef = useRef(onAfterSave);

  useEffect(() => { latestPlacementsRef.current = placements; }, [placements]);
  useEffect(() => { latestFormationIdRef.current = formationId; }, [formationId]);
  useEffect(() => { onAfterSaveRef.current = onAfterSave; }, [onAfterSave]);

  // Auto-save placements 500ms after the last change
  useEffect(() => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    if (!isInitializedRef.current) return;
    if (!formationId) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("idle");

    const capturedFormationId = formationId;
    const capturedPlacements = placements;

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      await savePlacements(capturedFormationId, capturedPlacements.map(toWire));
      await onAfterSaveRef.current?.(capturedPlacements, capturedFormationId);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [placements, formationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // History-aware setter — use for all user-initiated placement changes
  function setPlacements(newPlacements: Placement[]) {
    setPastPlacements((prev) => [...prev.slice(-49), placements]);
    setFuturePlacements([]);
    setPlacementsInternal(newPlacements);
  }

  // Load placements from server: suppress autosave, clear history
  function syncPlacements(newPlacements: Placement[]) {
    isSyncingRef.current = true;
    isInitializedRef.current = true;
    setPastPlacements([]);
    setFuturePlacements([]);
    setPlacementsInternal(newPlacements);
  }

  // Set placements without a history entry and without suppressing autosave
  // Use for non-undoable mutations that should still trigger a save (e.g. roster changes)
  function setPlacementsRaw(newPlacements: Placement[]) {
    setPlacementsInternal(newPlacements);
  }

  function clearHistory() {
    setPastPlacements([]);
    setFuturePlacements([]);
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

  // Flush the pending debounced save immediately (call before switching formations)
  async function saveImmediately() {
    const fId = latestFormationIdRef.current;
    if (!fId) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const p = latestPlacementsRef.current;
    setAutoSaveStatus("saving");
    await savePlacements(fId, p.map(toWire));
    await onAfterSaveRef.current?.(p, fId);
    setAutoSaveStatus("saved");
    setTimeout(() => setAutoSaveStatus("idle"), 2000);
  }

  return {
    placements,
    setPlacements,
    syncPlacements,
    setPlacementsRaw,
    clearHistory,
    isSyncingRef,
    undo,
    redo,
    canUndo: pastPlacements.length > 0,
    canRedo: futurePlacements.length > 0,
    autoSaveStatus,
    saveImmediately,
  };
}

function toWire(p: Placement) {
  return { choristId: p.choristId, gridX: p.gridX, gridY: p.gridY };
}
