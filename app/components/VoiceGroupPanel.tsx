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
  highlightPartId: string | null;
  onHighlightPart: (id: string | null) => void;
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
  highlightPartId,
  onHighlightPart,
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
    <div className="w-64 border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="font-bold mb-3">Voice Groups</h2>

      <select
        value={activeGroupId || ""}
        onChange={(e) => onSelectGroup(e.target.value || null)}
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
      >
        <option value="">No voice group</option>
        {voiceGroups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      <div className="flex gap-1 mb-4">
        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
          placeholder="New group..."
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
        />
        <button
          onClick={handleCreateGroup}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Add
        </button>
      </div>

      {activeGroup && (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs text-gray-500 font-medium">Parts</h3>
            <button
              onClick={handleDeleteGroup}
              className="text-red-400 hover:text-red-600 text-xs"
            >
              Delete group
            </button>
          </div>

          <ul className="space-y-1 mb-3">
            {activeGroup.parts.map((p) => (
              <li
                key={p.id}
                className={`flex items-center justify-between text-sm py-0.5 cursor-pointer rounded px-1 ${highlightPartId === p.id ? "bg-gray-200" : "hover:bg-gray-100"}`}
                onClick={() => onHighlightPart(highlightPartId === p.id ? null : p.id)}
              >
                <span className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}
                </span>
                <button
                  onClick={() => handleDeletePart(p.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  X
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-1">
            <input
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPart()}
              placeholder="Part name..."
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <div className="flex gap-1">
              <select
                value={newPartColor}
                onChange={(e) => setNewPartColor(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-1 py-1 text-sm"
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
                className="flex-1 border border-gray-300 rounded px-1 py-1 text-sm"
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
        </>
      )}
    </div>
  );
}
