"use client";

import { useEffect, useState } from "react";
import {
  createChorist,
  updateChorist,
  assignChorist,
  unassignChorist,
  archiveChorist,
} from "../lib/api";
import { sortVoiceGroups } from "../lib/voiceGroupSort";

type Chorist = {
  id: string;
  name: string;
  isSectionLeader: boolean;
  isArchived: boolean;
};

type VoicePart = { id: string; name: string; color: string; shape: string };
type VoiceGroup = { id: string; name: string; isStandard: boolean; parts: VoicePart[] };

type ChoristModalProps = {
  mode: "add" | "edit";
  chorist?: Chorist;
  voiceGroups: VoiceGroup[];
  /** Current part ID per group for this chorist (edit mode) */
  currentParts: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
};

export default function ChoristModal({
  mode,
  chorist,
  voiceGroups,
  currentParts,
  onClose,
  onSaved,
}: ChoristModalProps) {
  const [name, setName] = useState("");
  const [sectionLeader, setSectionLeader] = useState(false);
  const [parts, setParts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === "edit" && chorist) {
      setName(chorist.name);
      setSectionLeader(chorist.isSectionLeader);
      setParts(currentParts);
    } else {
      setName("");
      setSectionLeader(false);
      setParts({});
    }
  }, [mode, chorist, currentParts]);

  async function handleSave() {
    if (!name.trim()) return;

    if (mode === "add") {
      const created = await createChorist(name.trim(), sectionLeader);
      if (!created) return;
      for (const group of voiceGroups) {
        const partId = parts[group.id];
        if (partId) {
          await assignChorist(created.id, partId);
        }
      }
    } else if (chorist) {
      await updateChorist(chorist.id, name.trim(), sectionLeader);
      for (const group of voiceGroups) {
        const newPartId = parts[group.id] ?? "";
        const oldPartId = currentParts[group.id] ?? "";
        if (newPartId !== oldPartId) {
          if (newPartId === "") {
            await unassignChorist(group.id, chorist.id);
          } else {
            await assignChorist(chorist.id, newPartId);
          }
        }
      }
    }

    onSaved();
  }

  async function handleArchive() {
    if (!chorist || !window.confirm("Archive this chorist?")) return;
    await archiveChorist(chorist.id);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {mode === "add" ? "Add chorist" : "Edit chorist"}
        </h2>

        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full mb-4"
          autoFocus
        />

        <label className="flex items-center gap-2 text-sm mb-4">
          <input
            type="checkbox"
            checked={sectionLeader}
            onChange={(e) => setSectionLeader(e.target.checked)}
          />
          Section leader (stämledare)
        </label>

        <div className="space-y-3 mb-6">
          {sortVoiceGroups(voiceGroups).map((group) => (
            <div key={group.id}>
              <label className="block text-sm font-medium mb-1">
                {group.name}
              </label>
              <select
                value={parts[group.id] ?? ""}
                onChange={(e) =>
                  setParts((prev) => ({ ...prev, [group.id]: e.target.value }))
                }
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full bg-white"
              >
                <option value="">— Unassigned —</option>
                {group.parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            {mode === "edit" && (
              <button
                onClick={handleArchive}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Archive
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium"
            >
              {mode === "add" ? "Add" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
