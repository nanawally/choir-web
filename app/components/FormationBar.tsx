"use client";

import { useEffect, useState } from "react";
import {
  createFormation,
  deleteFormation,
  listFormations,
  loadFormation,
  savePlacements,
} from "../lib/api";

type Formation = { id: string; name: string };
type Placement = { choristId: string; x: number; y: number };

type Props = {
  placements: Placement[];
  onLoad: (
    placements: { choristId: string; gridX: number; gridY: number }[],
  ) => void;
};

export default function FormationBar({ placements, onLoad }: Props) {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listFormations().then(setFormations);
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    const formation = await createFormation(newName.trim());
    if (formation) {
      setFormations([...formations, formation]);
      setActiveId(formation.id);
      setNewName("");
    }
  }

  async function handleSelect(id: string) {
    setActiveId(id);
    const data = await loadFormation(id);
    if (data) {
      onLoad(data.placements);
    }
  }

  async function handleSave() {
    if (!activeId) return;
    setSaving(true);
    await savePlacements(
      activeId,
      placements.map((p) => ({
        choristId: p.choristId,
        gridX: p.x,
        gridY: p.y,
      })),
    );
    setSaving(false);
  }

  async function handleDelete() {
    if (!activeId) return;
    if (!window.confirm("Delete this formation?")) return;
    if (await deleteFormation(activeId)) {
      setFormations(formations.filter((f) => f.id !== activeId));
      setActiveId(null);
      onLoad([]);
    }
  }

  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200">
      <select
        value={activeId || ""}
        onChange={(e) => e.target.value && handleSelect(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-sm"
      >
        <option value="">Select formation</option>
        {formations.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      <input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        placeholder="New formation"
        className="border border-gray-300 rounded px-2 py-1 text-sm w-40"
      />
      <button
        onClick={handleCreate}
        className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
      >
        Create
      </button>

      <button
        onClick={handleSave}
        disabled={!activeId || saving}
        className="px-2 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>

      <button
        onClick={handleDelete}
        disabled={!activeId}
        className="px-1 py-1 bg-red-500 text-white rounded text-sm disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
