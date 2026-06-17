"use client";
import { useState } from "react";
import { apiFetch, assignChorist, unassignChorist } from "../lib/api";

type Chorist = { id: string; name: string };
type VoicePart = { id: string; name: string; color: string; shape: string };
type VoiceGroup = { id: string; name: string; parts: VoicePart[] };
type Assignment = { choristId: string; voicePartId: string };

type Props = {
  chorists: Chorist[];
  setChorists: (chorists: Chorist[]) => void;
  placedIds: Set<string>;
  onPlace: (id: string) => void;
  activeGroup: VoiceGroup | null;
  assignments: Assignment[];
  onAssignmentsChange: (assignments: Assignment[]) => void;
  hiddenIds: Set<string>;
  onToggleHidden: (ids: Set<string>) => void;
};

export default function RosterPanel({
  chorists,
  setChorists,
  placedIds,
  onPlace,
  activeGroup,
  assignments,
  onAssignmentsChange,
  hiddenIds,
  onToggleHidden,
}: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function handleAdd() {
    if (!newName.trim()) return;
    const res = await apiFetch("/chorists", {
      method: "POST",
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const chorist = await res.json();
      setChorists([...chorists, chorist]);
      setNewName("");
    }
  }

  async function handleDelete(id: string) {
    const res = await apiFetch(`/chorists/${id}`, { method: "DELETE" });
    if (res.ok) {
      setChorists(chorists.filter((c) => c.id !== id));
    }
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    const res = await apiFetch(`/chorists/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: editingName.trim() }),
    });
    if (res.ok) {
      setChorists(
        chorists.map((c) =>
          c.id === id ? { ...c, name: editingName.trim() } : c,
        ),
      );
      setEditingId(null);
    }
  }

  async function handleAssign(choristId: string, voicePartId: string) {
    if (!activeGroup) return;
    if (voicePartId === "") {
      await unassignChorist(activeGroup.id, choristId);
      onAssignmentsChange(assignments.filter((a) => a.choristId !== choristId));
    } else {
      await assignChorist(choristId, voicePartId);
      const updated = assignments.filter((a) => a.choristId !== choristId);
      updated.push({ choristId, voicePartId });
      onAssignmentsChange(updated);
    }
  }

  function getPartForChorist(choristId: string): VoicePart | null {
    if (!activeGroup) return null;
    const assignment = assignments.find((a) => a.choristId === choristId);
    if (!assignment) return null;
    return activeGroup.parts.find((p) => p.id === assignment.voicePartId) ?? null;
  }

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

  return (
    <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="font-bold mb-3">Roster</h2>

      <div className="flex gap-1 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add chorist..."
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Add
        </button>
      </div>

      {unplaced.length > 0 && (
        <>
          <h3 className="text-xs text-gray-500 font-medium mb-1">Unplaced</h3>
          <ul className="space-y-1 mb-4">
            {unplaced.map((c) => (
              <ChoristRow
                key={c.id}
                chorist={c}
                part={getPartForChorist(c.id)}
                editingId={editingId}
                editingName={editingName}
                onEditStart={(id, name) => { setEditingId(id); setEditingName(name); }}
                onEditChange={setEditingName}
                onEditSubmit={handleRename}
                onPlace={onPlace}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </>
      )}

      {placed.length > 0 && (
        <>
          <h3 className="text-xs text-gray-500 font-medium mb-1">Placed</h3>
          <ul className="space-y-1 mb-4">
            {placed.map((c) => (
              <li key={c.id} className={`flex items-center text-sm py-0.5 px-2 rounded ${hiddenIds.has(c.id) ? "opacity-40" : ""}`}>
                <button
                  onClick={() => toggleHidden(c.id)}
                  className="mr-1 text-xs w-5"
                  title={hiddenIds.has(c.id) ? "Show on grid" : "Hide from grid"}
                >
                  {hiddenIds.has(c.id) ? "🚫" : "👁"}
                </button>
                <span className="flex-1 truncate">{c.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {activeGroup && (
        <>
          <h3 className="text-xs text-gray-500 font-medium mb-1">Voice Parts</h3>
          <ul className="space-y-1">
            {chorists.map((c) => {
              const part = getPartForChorist(c.id);
              return (
                <li key={c.id} className="flex items-center gap-1 text-sm py-0.5">
                  {part && (
                    <span
                      className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: part.color }}
                    />
                  )}
                  <span className="flex-1 truncate">{c.name}</span>
                  <select
                    value={assignments.find((a) => a.choristId === c.id)?.voicePartId ?? ""}
                    onChange={(e) => handleAssign(c.id, e.target.value)}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs w-20"
                  >
                    <option value="">—</option>
                    {activeGroup.parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function ChoristRow({
  chorist,
  part,
  editingId,
  editingName,
  onEditStart,
  onEditChange,
  onEditSubmit,
  onPlace,
  onDelete,
}: {
  chorist: Chorist;
  part: VoicePart | null;
  editingId: string | null;
  editingName: string;
  onEditStart: (id: string, name: string) => void;
  onEditChange: (name: string) => void;
  onEditSubmit: (id: string) => void;
  onPlace: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-gray-100">
      {part && (
        <span
          className="w-3 h-3 rounded-full inline-block flex-shrink-0 mr-1"
          style={{ backgroundColor: part.color }}
        />
      )}
      {editingId === chorist.id ? (
        <input
          value={editingName}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEditSubmit(chorist.id)}
          onBlur={() => onEditSubmit(chorist.id)}
          autoFocus
          className="flex-1 border border-gray-300 rounded px-1"
        />
      ) : (
        <span
          onDoubleClick={() => onEditStart(chorist.id, chorist.name)}
          onClick={() => onPlace(chorist.id)}
          className="cursor-pointer flex-1 truncate"
        >
          {chorist.name}
        </span>
      )}
      <button
        onClick={() => onDelete(chorist.id)}
        className="text-red-400 hover:text-red-600 text-xs ml-2"
      >
        X
      </button>
    </li>
  );
}
