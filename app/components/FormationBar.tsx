"use client";

import { useEffect, useState } from "react";
import {
  listConcerts,
  listFormations,
  createFormation,
  deleteFormation,
  duplicateFormation,
  loadFormation,
  savePlacements,
  saveHiddenChorists,
  copyFormationToConcert,
} from "../lib/api";

type Concert = { id: string; name: string };
type Formation = { id: string; name: string; sortOrder: number };
type Placement = { choristId: string; x: number; y: number };

type Props = {
  concertId: string;
  placements: Placement[];
  hiddenIds: Set<string>;
  onLoad: (
    placements: { choristId: string; gridX: number; gridY: number }[],
    hiddenChoristIds: string[],
  ) => void;
  onFormationNameChange: (name: string | null) => void;
};

export default function FormationBar({
  concertId,
  placements,
  hiddenIds,
  onLoad,
  onFormationNameChange,
}: Props) {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [activeFormationId, setActiveFormationId] = useState<string | null>(
    null,
  );
  const [newFormationName, setNewFormationName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listFormations(concertId).then(setFormations);
  }, [concertId]);
  
  async function handleCreateFormation() {
    if (!newFormationName.trim()) return;
    const formation = await createFormation(concertId, newFormationName.trim());
    if (formation) {
      setFormations([...formations, formation]);
      setActiveFormationId(formation.id);
      onFormationNameChange(formation.name);
      setNewFormationName("");
      onLoad([], []);
    }
  }

  async function handleSelectFormation(id: string) {
    setActiveFormationId(id);
    const data = await loadFormation(id);
    if (data) {
      onLoad(data.placements, data.hiddenChoristIds || []);
      onFormationNameChange(data.name);
    }
  }

  async function handleSave() {
    if (!activeFormationId) return;
    setSaving(true);
    await Promise.all([
      savePlacements(
        activeFormationId,
        placements.map((p) => ({
          choristId: p.choristId,
          gridX: p.x,
          gridY: p.y,
        })),
      ),
      saveHiddenChorists(activeFormationId, [...hiddenIds]),
    ]);
    setSaving(false);
  }

  async function handleDeleteFormation() {
    if (!activeFormationId) return;
    if (!window.confirm("Delete this formation?")) return;
    if (await deleteFormation(activeFormationId)) {
      setFormations(formations.filter((f) => f.id !== activeFormationId));
      setActiveFormationId(null);
      onFormationNameChange(null);
      onLoad([], []);
    }
  }

  async function handleDuplicateFormation() {
    if (!activeFormationId) return;
    const copy = await duplicateFormation(activeFormationId);
    if (copy) {
      setFormations([...formations, copy]);
      setActiveFormationId(copy.id);
      onFormationNameChange(copy.name);
    }
  }

  async function handleCopyToConcert() {
    if (!activeFormationId) return;
    const allConcerts = await listConcerts();
    const otherConcerts = allConcerts.filter((c: Concert) => c.id !== concertId);
    if (otherConcerts.length === 0) {
      window.alert("No other concerts to copy to.");
      return;
    }
    const choice = window.prompt(
      "Copy to which concert?\n" +
        otherConcerts.map((c: Concert, i: number) => `${i + 1}. ${c.name}`).join("\n") +
        "\n\nEnter number:",
    );
    if (!choice) return;
    const idx = parseInt(choice, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= otherConcerts.length) return;
    await copyFormationToConcert(activeFormationId, otherConcerts[idx].id);
    window.alert(`Copied to "${otherConcerts[idx].name}".`);
  }

  return (
    <div className="flex flex-col gap-1 p-2 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <select
          value={activeFormationId || ""}
          onChange={(e) =>
            e.target.value && handleSelectFormation(e.target.value)
          }
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
          value={newFormationName}
          onChange={(e) => setNewFormationName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateFormation()}
          placeholder="New formation"
          className="border border-gray-300 rounded px-2 py-1 text-sm w-36"
        />
        <button
          onClick={handleCreateFormation}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Create
        </button>

        <button
          onClick={handleSave}
          disabled={!activeFormationId || saving}
          className="px-2 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {activeFormationId && (
          <>
            <button
              onClick={handleDuplicateFormation}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              Duplicate
            </button>
            <button
              onClick={handleCopyToConcert}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              Copy to...
            </button>
            <button
              onClick={handleDeleteFormation}
              className="px-1 py-1 bg-red-500 text-white rounded text-sm"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
