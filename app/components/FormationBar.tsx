"use client";

import { useRef, useState } from "react";
import {
  listConcerts,
  createFormation,
  deleteFormation,
  duplicateFormation,
  renameFormation,
  savePlacements,
  copyFormationToConcert,
  copyBaseIntoConcert,
  loadFormation,
  setSongFormations,
  updateRowSizes,
} from "../lib/api";
import AddFormationModal from "./AddFormationModal";
import { useTranslation } from "../lib/LanguageContext";

type Concert = { id: string; name: string };
type Formation = { id: string; name: string; sortOrder: number };
type Placement = { choristId: string; gridX: number; gridY: number };

type Props = {
  concertId: string;
  placements: Placement[];
  onLoad: (
    placements: { choristId: string; gridX: number; gridY: number }[],
    hiddenChoristIds: string[],
    rowSizes: number[],
  ) => void;
  onFormationNameChange: (name: string | null) => void;
  songFormationIds: Set<string>;
  activeConcertSongId: string | null;
  onSongFormationsChange: (ids: Set<string>) => void;
  rowSizes: number[];
  onRowSizesChange: (sizes: number[]) => void;
  onClampPlacements: (rowIndex: number, newSize: number) => void;
  activeFormationId: string | null;
  onActiveFormationIdChange: (id: string | null) => void;
  formationName: string | null;
  formations: Formation[];
  onFormationsChange: (formations: Formation[]) => void;
};

export default function FormationBar({
  concertId,
  placements,
  onLoad,
  onFormationNameChange,
  songFormationIds,
  activeConcertSongId,
  onSongFormationsChange,
  rowSizes,
  onRowSizesChange,
  onClampPlacements,
  activeFormationId,
  onActiveFormationIdChange,
  formationName,
  formations,
  onFormationsChange,
}: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Arc mode is active when there are arc rows defined
  const isArcMode = rowSizes.length > 0;

  async function handleRename() {
    if (!activeFormationId || !nameInput.trim()) return;
    const trimmed = nameInput.trim();
    if (trimmed === formationName) {
      setEditingName(false);
      return;
    }
    await renameFormation(activeFormationId, trimmed);
    onFormationNameChange(trimmed);
    // Update the name in the formations list so setlist tags reflect it
    onFormationsChange(
      formations.map((f) =>
        f.id === activeFormationId ? { ...f, name: trimmed } : f,
      ),
    );
    setEditingName(false);
  }

  async function handleCreateFormation(name: string) {
    const formation = await createFormation(concertId, name.trim());
    if (formation) {
      onFormationsChange([...formations, formation]);
      onActiveFormationIdChange(formation.id);
      onFormationNameChange(formation.name);
      onLoad([], [], []);
      if (activeConcertSongId) {
        const updatedIds = [...songFormationIds, formation.id];
        await setSongFormations(activeConcertSongId, updatedIds);
        onSongFormationsChange(new Set(updatedIds));
      }
    }
  }

  async function handleSave() {
    if (!activeFormationId) return;
    setSaving(true);
    await savePlacements(
      activeFormationId,
      placements.map((p) => ({
        choristId: p.choristId,
        gridX: p.gridX,
        gridY: p.gridY,
      })),
    );
    // If a song is selected, ensure this formation is linked to it
    if (activeConcertSongId && !songFormationIds.has(activeFormationId)) {
      const updatedIds = [...songFormationIds, activeFormationId];
      await setSongFormations(activeConcertSongId, updatedIds);
      onSongFormationsChange(new Set(updatedIds));
    }
    setSaving(false);
  }

  async function handleDeleteFormation() {
    if (!activeFormationId) return;
    const formation = formations.find((f) => f.id === activeFormationId);
    if (!window.confirm(t("formations.confirmDelete").replace("{name}", formation?.name ?? ""))) return;
    if (await deleteFormation(activeFormationId)) {
      onFormationsChange(formations.filter((f) => f.id !== activeFormationId));
      onActiveFormationIdChange(null);
      onFormationNameChange(null);
      onLoad([], [], []);
    }
  }

  async function handleReuseFormation(formationId: string) {
    if (!activeConcertSongId) return;
    const updatedIds = [...songFormationIds, formationId];
    await setSongFormations(activeConcertSongId, updatedIds);
    onSongFormationsChange(new Set(updatedIds));
  }

  async function handleDuplicateFormation() {
    if (!activeFormationId) return;
    const copy = await duplicateFormation(activeFormationId);
    if (copy) {
      onFormationsChange([...formations, copy]);
      onActiveFormationIdChange(copy.id);
      onFormationNameChange(copy.name);
    }
  }

  async function handleCopyBase(baseFormationId: string) {
    const result = await copyBaseIntoConcert(baseFormationId, concertId);
    if (result) {
      onFormationsChange([...formations, result]);
      onActiveFormationIdChange(result.id);
      onFormationNameChange(result.name);
      // Load the copied formation's placements onto the grid
      const detail = await loadFormation(result.id);
      if (detail) {
        onLoad(
          detail.placements.map(
            (p: { choristId: string; gridX: number; gridY: number }) => ({
              choristId: p.choristId,
              gridX: p.gridX,
              gridY: p.gridY,
            }),
          ),
          detail.hiddenChoristIds || [],
          JSON.parse(detail.rowSizes || "[]"),
        );
      }
      if (activeConcertSongId) {
        const updatedIds = [...songFormationIds, result.id];
        await setSongFormations(activeConcertSongId, updatedIds);
        onSongFormationsChange(new Set(updatedIds));
      }
    }
  }

  async function handleCopyToConcert() {
    if (!activeFormationId) return;
    const allConcerts = await listConcerts();
    const otherConcerts = allConcerts.filter(
      (c: Concert) => c.id !== concertId,
    );
    if (otherConcerts.length === 0) {
      window.alert(t("formations.noConcertsToCopy"));
      return;
    }
    const choice = window.prompt(
      t("formations.copyToWhichConcert") +
        "\n" +
        otherConcerts
          .map((c: Concert, i: number) => `${i + 1}. ${c.name}`)
          .join("\n") +
        `\n\n${t("formations.enterNumber")}`,
    );
    if (!choice) return;
    const idx = parseInt(choice, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= otherConcerts.length) return;
    await copyFormationToConcert(activeFormationId, otherConcerts[idx].id);
    window.alert(`${t("formations.copiedTo")} "${otherConcerts[idx].name}".`);
  }

  function handleSetArcMode(arc: boolean) {
    if (!activeFormationId) return;
    if (arc && rowSizes.length === 0) {
      // Switching to arc — add a default row
      const next = [10];
      onRowSizesChange(next);
      updateRowSizes(activeFormationId, next);
    } else if (!arc) {
      // Switching to rectangle — clear all rows
      onRowSizesChange([]);
      updateRowSizes(activeFormationId, []);
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      <h2 className="font-bold mb-1">{t("formations.formations")}</h2>

      {/* Add new formation button — always visible */}
      <button
        onClick={() => setShowAddModal(true)}
        className="px-3 py-1.5 btn-primary text-sm w-fit"
      >
        {t("formations.addNewFormation")}
      </button>

      {/* Everything below only shows when a formation is selected */}
      {activeFormationId && formationName && (
        <>
          {/* Formation name — click to edit */}
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setEditingName(false);
              }}
              className="text-sm font-medium text-foreground mt-1 border-b border-border-strong outline-none w-full"
              autoFocus
            />
          ) : (
            <p
              className="text-sm font-medium text-foreground mt-1 cursor-pointer hover:underline"
              onClick={() => {
                setNameInput(formationName || "");
                setEditingName(true);
              }}
              title={t("common.clickToRename")}
            >
              {formationName}
            </p>
          )}

          {/* Layout mode dropdown */}
          <select
            value={isArcMode ? "arc" : "grid"}
            onChange={(e) => handleSetArcMode(e.target.value === "arc")}
            className="mt-1 border border-border rounded px-2 py-1.5 text-sm w-fit"
          >
            <option value="arc">{t("formations.arc")}</option>
            <option value="grid">{t("formations.grid")}</option>
          </select>

          {/* Arc row configuration — only visible in arc mode */}
          {isArcMode && (
            <div className="mt-1">
              <h4 className="text-xs font-medium mb-1 text-muted">
                {t("formations.arcRows")}
              </h4>
              {rowSizes.map((size, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <span className="text-xs w-12">{`${t("formations.row")} ${i + 1}:`}</span>
                  <input
                    type="number"
                    value={size}
                    min={placements.filter((p) => p.gridY === i).length || 1}
                    onChange={(e) => {
                      const next = [...rowSizes];
                      next[i] = parseInt(e.target.value) || 1;
                      onRowSizesChange(next);
                      onClampPlacements(i, next[i]);
                      updateRowSizes(activeFormationId, next);
                    }}
                    className="border border-border rounded px-1 py-0.5 text-sm w-16"
                  />
                  <button
                    onClick={() => {
                      const next = rowSizes.filter((_, j) => j !== i);
                      onRowSizesChange(next);
                      updateRowSizes(activeFormationId, next);
                    }}
                    className="text-danger hover:text-danger-hover text-xs"
                  >
                    X
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const next = [...rowSizes, 10];
                  onRowSizesChange(next);
                  updateRowSizes(activeFormationId, next);
                }}
                className="text-xs text-link hover:underline"
              >
                {t("formations.addRow")}
              </button>
            </div>
          )}
        </>
      )}

      {/* Spacer before voice groups (rendered by parent) */}
      <div className="mt-2 border-t border-border" />

      {/* Save / action buttons — only when a formation is selected */}
      {activeFormationId && (
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 btn-success text-sm w-fit font-medium"
          >
            {saving ? t("common.saving") : t("formations.saveFormation")}
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDuplicateFormation}
              className="px-2 py-1 bg-surface-alt hover:bg-surface-alt rounded text-sm"
            >
              {t("common.duplicate")}
            </button>
            <button
              onClick={handleCopyToConcert}
              className="px-2 py-1 bg-surface-alt hover:bg-surface-alt rounded text-sm"
            >
              {t("formations.copyTo")}
            </button>
            <button
              onClick={handleDeleteFormation}
              className="px-2 py-1 btn-danger text-sm"
            >
              {t("common.delete")}
            </button>
          </div>
        </div>
      )}

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
        onCopyBase={(baseFormationId) => {
          handleCopyBase(baseFormationId);
          setShowAddModal(false);
        }}
      />
    </div>
  );
}
