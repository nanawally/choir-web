import { useEffect, useState } from "react";
import { loadFormation, renameFormation, updateRowSizes } from "../lib/api";
import { CELL_SIZE, GRID_WIDTH, GRID_HEIGHT } from "../lib/editorTypes";
import type { Placement } from "../lib/editorTypes";
import { usePlacementHistory } from "./usePlacementHistory";
import { useEditorData } from "./useEditorData";

export function useBaseFormationEditor(formationId: string) {
  const data = useEditorData();
  const history = usePlacementHistory({ formationId });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formationName, setFormationName] = useState<string | null>(null);
  const [rowSizes, setRowSizes] = useState<number[]>([]);

  // Panels
  const [showChorists, setShowChorists] = useState(false);
  const [showFormationControls, setShowFormationControls] = useState(false);
  const [showVoiceGroups, setShowVoiceGroups] = useState(false);

  useEffect(() => {
    loadFormation(formationId).then((d) => {
      if (d) {
        setFormationName(d.name);
        setRowSizes(JSON.parse(d.rowSizes || "[]"));
        history.syncPlacements(
          d.placements.map((p: Placement) => ({ choristId: p.choristId, gridX: p.gridX, gridY: p.gridY })),
        );
      }
    });
  }, [formationId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePlace(choristId: string) {
    const occupied = new Set(history.placements.map((p) => `${p.gridX},${p.gridY}`));
    if (rowSizes.length > 0) {
      for (let gridY = 0; gridY < rowSizes.length; gridY++) {
        for (let gridX = 0; gridX < rowSizes[gridY]; gridX++) {
          if (!occupied.has(`${gridX},${gridY}`)) {
            history.setPlacements([...history.placements, { choristId, gridX, gridY }]);
            return;
          }
        }
      }
    } else {
      for (let gridY = 1; gridY < GRID_HEIGHT / CELL_SIZE; gridY++) {
        for (let gridX = 1; gridX < GRID_WIDTH / CELL_SIZE; gridX++) {
          if (!occupied.has(`${gridX},${gridY}`)) {
            history.setPlacements([...history.placements, { choristId, gridX, gridY }]);
            return;
          }
        }
      }
    }
  }

  function handleRemove(choristId: string) {
    history.setPlacements(history.placements.filter((p) => p.choristId !== choristId));
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
    const onRow = history.placements.filter((p) => p.gridY === rowIndex);
    const notOnRow = history.placements.filter((p) => p.gridY !== rowIndex);
    const valid = onRow.filter((p) => p.gridX < newSize);
    const overflow = onRow.filter((p) => p.gridX >= newSize);
    const taken = new Set(valid.map((p) => p.gridX));
    const clamped = overflow.map((p) => {
      for (let x = newSize - 1; x >= 0; x--) {
        if (!taken.has(x)) { taken.add(x); return { ...p, gridX: x }; }
      }
      return p;
    });
    history.setPlacementsRaw([...notOnRow, ...valid, ...clamped]);
  }

  const placedIds = new Set(history.placements.map((p) => p.choristId));

  return {
    // From shared data hook
    chorists: data.chorists,
    sortedChorists: data.sortedChorists,
    voiceGroups: data.voiceGroups,
    setVoiceGroups: data.setVoiceGroups,
    activeGroupId: data.activeGroupId,
    assignments: data.assignments,
    highlightPartId: data.highlightPartId,
    setHighlightPartId: data.setHighlightPartId,
    handleSelectGroup: data.handleSelectGroup,

    // From placement history hook
    placements: history.placements,
    setPlacements: history.setPlacements,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    autoSaveStatus: history.autoSaveStatus,
    handleSave: history.saveImmediately,

    // Local state
    selectedIds,
    setSelectedIds,
    formationName,
    rowSizes,
    showChorists,
    setShowChorists,
    showFormationControls,
    setShowFormationControls,
    showVoiceGroups,
    setShowVoiceGroups,
    placedIds,

    // Handlers
    handlePlace,
    handleRemove,
    handleRename,
    handleSetArcMode,
    handleUpdateRowSize,
    handleAddRow,
    handleRemoveRow,
  };
}