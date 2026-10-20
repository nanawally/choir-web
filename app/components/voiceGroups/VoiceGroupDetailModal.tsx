"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "../../lib/LanguageContext";
import {
  getAssignments,
  assignChorist,
  unassignChorist,
  listChorists,
} from "../../lib/api";
import type { VoiceGroup } from "../../hooks/useVoiceGroups";

type Chorist = {
  id: string;
  firstName: string;
  lastName: string;
  isArchived: boolean;
};
type Assignment = { choristId: string; voicePartId: string };

interface Props {
  group: VoiceGroup;
  onClose: () => void;
  onRename: (id: string, newName: string) => void;
  onToggleStandard: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

export default function VoiceGroupDetailModal({
  group,
  onClose,
  onRename,
  onToggleStandard,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(group.name);
  const [addingToPart, setAddingToPart] = useState<string | null>(null);
  const [selectedChoristId, setSelectedChoristId] = useState("");

  useEffect(() => {
    Promise.all([getAssignments(group.id), listChorists()]).then(([a, c]) => {
      setAssignments(a);
      setChorists(c.filter((ch: Chorist) => !ch.isArchived));
      setLoading(false);
    });
  }, [group.id]);

  // Sync rename input when group name changes from outside (parent update)
  useEffect(() => {
    if (!renaming) setRenameValue(group.name);
  }, [group.name, renaming]);

  function getAssignedChorists(partId: string): Chorist[] {
    return assignments
      .filter((a) => a.voicePartId === partId)
      .map((a) => chorists.find((c) => c.id === a.choristId))
      .filter(Boolean) as Chorist[];
  }

  function getUnassignedChorists(): Chorist[] {
    const assignedIds = new Set(assignments.map((a) => a.choristId));
    return chorists.filter((c) => !assignedIds.has(c.id));
  }

  async function handleAssign(partId: string) {
    if (!selectedChoristId) return;
    if (await assignChorist(selectedChoristId, partId)) {
      setAssignments([
        ...assignments,
        { choristId: selectedChoristId, voicePartId: partId },
      ]);
    }
    setAddingToPart(null);
    setSelectedChoristId("");
  }

  async function handleUnassign(choristId: string) {
    if (await unassignChorist(group.id, choristId)) {
      setAssignments(assignments.filter((a) => a.choristId !== choristId));
    }
  }

  function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    setRenaming(false);
    if (!trimmed || trimmed === group.name) return;
    onRename(group.id, trimmed);
  }

  const unassignedChorists = getUnassignedChorists();

  return (
    <div
      className="fixed inset-0 bg-overlay flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {renaming ? (
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") {
                    setRenaming(false);
                    setRenameValue(group.name);
                  }
                }}
                onBlur={handleRenameSubmit}
                className="border border-border rounded px-2 py-0.5 text-sm font-medium w-44"
                autoFocus
              />
            ) : (
              <h2
                className="text-lg font-semibold cursor-pointer hover:text-link truncate"
                title={t("common.clickToRename")}
                onClick={() => {
                  setRenameValue(group.name);
                  setRenaming(true);
                }}
              >
                {group.name}
              </h2>
            )}
            <label className="flex items-center gap-1 text-xs text-muted cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={group.isStandard}
                onChange={() => onToggleStandard(group.id, group.isStandard)}
              />
              {t("common.standard")}
            </label>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDelete(group.id)}
              className="text-danger hover:text-danger-hover text-xs px-2 py-1 border border-danger rounded"
            >
              {t("common.delete")}
            </button>
            <button onClick={onClose} className="text-subtle hover:text-muted">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
          {loading ? (
            <p className="text-muted text-sm">{t("common.loading")}</p>
          ) : group.parts.length === 0 ? (
            <p className="text-subtle text-sm">{t("voiceGroups.noParts")}</p>
          ) : (
            group.parts.map((part) => {
              const assigned = getAssignedChorists(part.id);
              const isAdding = addingToPart === part.id;
              return (
                <div
                  key={part.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  {/* Part header */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-hover-bg">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: part.color }}
                    />
                    <span className="text-sm font-medium">{part.name}</span>
                    <span className="text-xs text-subtle ml-auto">
                      {assigned.length}
                    </span>
                  </div>

                  {/* Assigned chorists */}
                  {assigned.length > 0 && (
                    <ul className="divide-y divide-border">
                      {assigned.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between px-3 py-1.5 text-sm"
                        >
                          <span>
                            {c.firstName} {c.lastName}
                          </span>
                          <button
                            onClick={() => handleUnassign(c.id)}
                            className="text-xs text-muted hover:text-danger"
                          >
                            {t("voiceGroups.unassign")}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Assign row */}
                  <div className="px-3 py-2 border-t border-border">
                    {isAdding ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedChoristId}
                          onChange={(e) => setSelectedChoristId(e.target.value)}
                          className="flex-1 border border-border rounded px-2 py-1 text-sm bg-surface"
                          autoFocus
                        >
                          <option value="">—</option>
                          {unassignedChorists.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.firstName} {c.lastName}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssign(part.id)}
                          disabled={!selectedChoristId}
                          className="px-2 py-1 btn-primary text-xs disabled:opacity-50"
                        >
                          {t("common.add")}
                        </button>
                        <button
                          onClick={() => {
                            setAddingToPart(null);
                            setSelectedChoristId("");
                          }}
                          className="px-2 py-1 border border-border rounded text-xs"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingToPart(part.id);
                          setSelectedChoristId("");
                        }}
                        disabled={unassignedChorists.length === 0}
                        className="text-xs text-link hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-default"
                      >
                        {t("voiceGroups.assignChorist")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
