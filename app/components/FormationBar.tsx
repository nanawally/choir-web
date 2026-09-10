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
  copyFormationToConcert,
  setSongFormations,
} from "../lib/api";
import AddFormationModal from "./AddFormationModal";

type Concert = { id: string; name: string };
type Formation = { id: string; name: string; sortOrder: number };
type Placement = { choristId: string; x: number; y: number };

type Props = {
  concertId: string;
  placements: Placement[];
  onLoad: (
    placements: { choristId: string; gridX: number; gridY: number }[],
    hiddenChoristIds: string[],
  ) => void;
  onFormationNameChange: (name: string | null) => void;
  songFormationIds: Set<string>;
  activeConcertSongId: string | null;
  onSongFormationsChange: (ids: Set<string>) => void;
};

export default function FormationBar({
  concertId,
  placements,
  onLoad,
  onFormationNameChange,
  songFormationIds,
  activeConcertSongId,
  onSongFormationsChange,
}: Props) {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [activeFormationId, setActiveFormationId] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const visibleFormations =
    songFormationIds.size > 0
      ? formations.filter((f) => songFormationIds.has(f.id))
      : formations;

  useEffect(() => {
    listFormations(concertId).then(setFormations);
  }, [concertId]);

  async function handleCreateFormation(name: string) {
    const formation = await createFormation(concertId, name.trim());
    if (formation) {
      setFormations([...formations, formation]);
      setActiveFormationId(formation.id);
      onFormationNameChange(formation.name);
      onLoad([], []);
      if (activeConcertSongId) {
        const updatedIds = [...songFormationIds, formation.id];
        await setSongFormations(activeConcertSongId, updatedIds);
        onSongFormationsChange(new Set(updatedIds));
      }
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

  async function handleReuseFormation(formationId: string) {
    if (!activeConcertSongId) return;
    const updatedIds = [...songFormationIds, formationId];
    await setSongFormations(activeConcertSongId, updatedIds);
    onSongFormationsChange(new Set(updatedIds));
    handleSelectFormation(formationId);
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
    const otherConcerts = allConcerts.filter(
      (c: Concert) => c.id !== concertId,
    );
    if (otherConcerts.length === 0) {
      window.alert("No other concerts to copy to.");
      return;
    }
    const choice = window.prompt(
      "Copy to which concert?\n" +
        otherConcerts
          .map((c: Concert, i: number) => `${i + 1}. ${c.name}`)
          .join("\n") +
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
          {visibleFormations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Add
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
      <AddFormationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        formations={formations}
        songFormationIds={songFormationIds}
        onCreateNew={(name) => {
          handleCreateFormation(name);
          setShowAddModal(false);
        }}
        onReuse={(formationId) => {
          handleReuseFormation(formationId);
          setShowAddModal(false);
        }}
      />
    </div>
  );
}
