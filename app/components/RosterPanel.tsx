"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

type Chorist = { id: string; name: string };

type Props = {
  chorists: Chorist[];
  setChorists: (chorists: Chorist[]) => void;
  placedIds: Set<string>;
  onPlace: (id: string) => void;
};

export default function RosterPanel({
  chorists,
  setChorists,
  placedIds,
  onPlace,
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

  return (
    <div className="w-64 border-r border-gray-200 p-4">
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

      <ul className="space-y-1">
        {chorists
          .filter((c) => !placedIds.has(c.id))
          .map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-gray-100"
            >
              {editingId === c.id ? (
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename(c.id)}
                  onBlur={() => handleRename(c.id)}
                  autoFocus
                  className="flex-1 border border-gray-300 rounded px-1"
                />
              ) : (
                <span
                  onDoubleClick={() => {
                    setEditingId(c.id);
                    setEditingName(c.name);
                  }}
                  onClick={() => onPlace(c.id)}
                  className="cursor-pointer"
                >
                  {c.name}
                </span>
              )}
              <button
                onClick={() => handleDelete(c.id)}
                className="text-red-400 hover:text-red-600 text-xs ml-2"
              >
                X
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}
