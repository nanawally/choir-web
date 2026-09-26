import { useEffect, useState } from "react";
import {
  listVoiceGroups,
  createVoiceGroup,
  renameVoiceGroup,
  deleteVoiceGroup,
  setVoiceGroupStandard,
  addVoicePart,
  updateVoicePart,
  deleteVoicePart,
  reorderVoiceParts,
} from "../lib/api";
import { sortVoiceGroups } from "../lib/voiceGroupSort";
import type { DragEndEvent } from "@dnd-kit/core";

export type VoicePart = { id: string; name: string; color: string; shape: string };
export type VoiceGroup = {
  id: string;
  name: string;
  isStandard: boolean;
  parts: VoicePart[];
};

const DEFAULT_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#f9ca24",
  "#a55eea",
  "#26de81",
  "#fd9644",
  "#778ca3",
];

export const SHAPES = ["circle", "square", "triangle", "diamond", "cross", "star"];

export function useVoiceGroups() {
  const [groups, setGroups] = useState<VoiceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupStandard, setNewGroupStandard] = useState(true);
  const [addingPartGroupId, setAddingPartGroupId] = useState<string | null>(null);
  const [newPartName, setNewPartName] = useState("");
  const [newPartColor, setNewPartColor] = useState(DEFAULT_COLORS[0]);
  const [newPartShape, setNewPartShape] = useState(SHAPES[0]);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    listVoiceGroups().then(setGroups).finally(() => setLoading(false));
  }, []);

  const standardGroups = sortVoiceGroups(groups.filter((g) => g.isStandard));
  const otherGroups = sortVoiceGroups(groups.filter((g) => !g.isStandard));

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    const group = await createVoiceGroup(newGroupName.trim(), newGroupStandard);
    if (group) {
      setGroups([...groups, group]);
      setNewGroupName("");
      setNewGroupStandard(true);
      setShowAddGroup(false);
    }
  }

  async function handleRenameGroup(id: string) {
    if (!renameValue.trim()) return;
    if (await renameVoiceGroup(id, renameValue.trim())) {
      setGroups(
        groups.map((g) =>
          g.id === id ? { ...g, name: renameValue.trim() } : g,
        ),
      );
    }
    setRenamingGroupId(null);
  }

  async function handleToggleStandard(id: string, current: boolean) {
    if (await setVoiceGroupStandard(id, !current)) {
      setGroups(
        groups.map((g) =>
          g.id === id ? { ...g, isStandard: !current } : g,
        ),
      );
    }
  }

  async function handleDeleteGroup(id: string) {
    if (!window.confirm("Delete this voice group and all its parts?")) return;
    if (await deleteVoiceGroup(id)) {
      setGroups(groups.filter((g) => g.id !== id));
    }
  }

  async function handleAddPart(groupId: string) {
    if (!newPartName.trim()) return;
    const part = await addVoicePart(groupId, newPartName.trim(), newPartColor, newPartShape);
    if (part) {
      setGroups(
        groups.map((g) =>
          g.id === groupId ? { ...g, parts: [...g.parts, part] } : g,
        ),
      );
      setNewPartName("");
      setAddingPartGroupId(null);
      const nextIdx = (DEFAULT_COLORS.indexOf(newPartColor) + 1) % DEFAULT_COLORS.length;
      setNewPartColor(DEFAULT_COLORS[nextIdx]);
    }
  }

  async function handleUpdatePart(partId: string, name: string, color: string, shape: string) {
    if (await updateVoicePart(partId, name, color, shape)) {
      setGroups(
        groups.map((g) => ({
          ...g,
          parts: g.parts.map((p) =>
            p.id === partId ? { ...p, name, color, shape } : p,
          ),
        })),
      );
    }
  }

  async function handleDeletePart(partId: string) {
    if (await deleteVoicePart(partId)) {
      setGroups(
        groups.map((g) => ({
          ...g,
          parts: g.parts.filter((p) => p.id !== partId),
        })),
      );
    }
  }

  function handlePartDragEnd(groupId: string, event: DragEndEvent) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = group.parts.findIndex((p) => p.id === active.id);
    const newIndex = group.parts.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...group.parts];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, group.parts[oldIndex]);

    setGroups(
      groups.map((g) => (g.id === groupId ? { ...g, parts: reordered } : g)),
    );
    reorderVoiceParts(groupId, reordered.map((p) => p.id));
  }

  return {
    groups,
    loading,
    standardGroups,
    otherGroups,
    showAddGroup,
    setShowAddGroup,
    newGroupName,
    setNewGroupName,
    newGroupStandard,
    setNewGroupStandard,
    addingPartGroupId,
    setAddingPartGroupId,
    newPartName,
    setNewPartName,
    newPartColor,
    setNewPartColor,
    newPartShape,
    setNewPartShape,
    renamingGroupId,
    setRenamingGroupId,
    renameValue,
    setRenameValue,
    handleCreateGroup,
    handleRenameGroup,
    handleToggleStandard,
    handleDeleteGroup,
    handleAddPart,
    handleUpdatePart,
    handleDeletePart,
    handlePartDragEnd,
  };
}
