"use client";
import { useState } from "react";
import {
  createVoiceGroup,
  deleteVoiceGroup,
  addVoicePart,
  deleteVoicePart,
} from "../lib/api";

type VoicePart = { id: string; name: string; color: string; shape: string };
type VoiceGroup = { id: string; name: string; parts: VoicePart[] };

type Props = {
  activeGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  voiceGroups: VoiceGroup[];
  setVoiceGroups: (groups: VoiceGroup[]) => void;
};

const COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#f9ca24",
  "#a55eea",
  "#26de81",
  "#fd9644",
  "#778ca3",
];
const SHAPES = ["circle", "square", "triangle"];

export default function VoiceGroupPanel({
  activeGroupId,
  onSelectGroup,
  voiceGroups,
  setVoiceGroups,
}: Props) {
  const [newGroupName, setNewGroupName] = useState("");
  const [showParts, setShowParts] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [newPartColor, setNewPartColor] = useState(COLORS[0]);
  const [newPartShape, setNewPartShape] = useState(SHAPES[0]);

  const activeGroup = voiceGroups.find((g) => g.id === activeGroupId) ?? null;

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    const group = await createVoiceGroup(newGroupName.trim());
    if (group) {
      setVoiceGroups([...voiceGroups, group]);
      setNewGroupName("");
      onSelectGroup(group.id);
    }
  }

  async function handleDeleteGroup() {
    if (!activeGroupId) return;
    if (!window.confirm("Delete this voice group?")) return;
    if (await deleteVoiceGroup(activeGroupId)) {
      setVoiceGroups(voiceGroups.filter((g) => g.id !== activeGroupId));
      onSelectGroup(null);
    }
  }

  async function handleAddPart() {
    if (!activeGroupId || !newPartName.trim()) return;
    const part = await addVoicePart(
      activeGroupId,
      newPartName.trim(),
      newPartColor,
      newPartShape,
    );
    if (part) {
      setVoiceGroups(
        voiceGroups.map((g) =>
          g.id === activeGroupId ? { ...g, parts: [...g.parts, part] } : g,
        ),
      );
      setNewPartName("");
      // Auto-advance color for next part
      const nextIdx = (COLORS.indexOf(newPartColor) + 1) % COLORS.length;
      setNewPartColor(COLORS[nextIdx]);
    }
  }

  async function handleDeletePart(partId: string) {
    if (await deleteVoicePart(partId)) {
      setVoiceGroups(
        voiceGroups.map((g) => ({
          ...g,
          parts: g.parts.filter((p) => p.id !== partId),
        })),
      );
    }
  }

  return (
    <div className="flex items-start gap-2 p-2 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <select
          value={activeGroupId || ""}
          onChange={(e) => onSelectGroup(e.target.value || null)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">No voice group</option>
          {voiceGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
          placeholder="New group..."
          className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
        />
        <button
          onClick={handleCreateGroup}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Create
        </button>

        {activeGroupId && (
          <>
            <button
              onClick={() => setShowParts(!showParts)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {showParts ? "Hide parts" : "Edit parts"}
            </button>
            <button
              onClick={handleDeleteGroup}
              className="px-2 py-1 bg-red-500 text-white rounded text-sm"
            >
              Delete
            </button>
          </>
        )}
      </div>

      {showParts && activeGroup && (
        <div className="ml-4 border-l border-gray-200 pl-4">
          <div className="flex flex-wrap gap-1 mb-2">
            {activeGroup.parts.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.name} ({p.shape})
                <button
                  onClick={() => handleDeletePart(p.id)}
                  className="ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <input
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPart()}
              placeholder="Part name..."
              className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
            />
            <select
              value={newPartColor}
              onChange={(e) => setNewPartColor(e.target.value)}
              className="border border-gray-300 rounded px-1 py-1 text-sm"
              style={{ backgroundColor: newPartColor, color: "white" }}
            >
              {COLORS.map((c) => (
                <option key={c} value={c} style={{ backgroundColor: c }}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={newPartShape}
              onChange={(e) => setNewPartShape(e.target.value)}
              className="border border-gray-300 rounded px-1 py-1 text-sm"
            >
              {SHAPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddPart}
              className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
