"use client";

import { useState } from "react";
import {
  createChorist,
  updateChorist,
  assignChorist,
  unassignChorist,
  archiveChorist,
} from "../lib/api";
import { sortVoiceGroups } from "../lib/voiceGroupSort";
import { useTranslation } from "../lib/LanguageContext";

type Chorist = {
  id: string;
  firstName: string;
  lastName: string;
  isSectionLeader: boolean;
  isArchived: boolean;
};

type VoicePart = { id: string; name: string; color: string; shape: string };
type VoiceGroup = {
  id: string;
  name: string;
  isStandard: boolean;
  parts: VoicePart[];
};

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
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(
    mode === "edit" && chorist ? chorist.firstName : "",
  );
  const [lastName, setLastName] = useState(
    mode === "edit" && chorist ? chorist.lastName : "",
  );
  const [sectionLeader, setSectionLeader] = useState(
    mode === "edit" && chorist ? chorist.isSectionLeader : false,
  );
  const [parts, setParts] = useState<Record<string, string>>(
    mode === "edit" ? currentParts : {},
  );

  async function handleSave() {
    if (!firstName.trim()) return;

    if (mode === "add") {
      const created = await createChorist(
        firstName.trim(),
        lastName.trim(),
        sectionLeader,
      );
      if (!created) return;
      for (const group of voiceGroups) {
        const partId = parts[group.id];
        if (partId) {
          await assignChorist(created.id, partId);
        }
      }
    } else if (chorist) {
      await updateChorist(
        chorist.id,
        firstName.trim(),
        lastName.trim(),
        sectionLeader,
      );
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
    if (!chorist || !window.confirm(t("chorists.confirmArchive"))) return;
    await archiveChorist(chorist.id);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {mode === "add" ? t("chorists.addTitle") : t("chorists.editTitle")}
        </h2>

        <label className="block text-sm font-medium mb-1">
          {t("chorists.firstName")}
        </label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="border border-border rounded px-3 py-2 text-sm w-full mb-3"
          autoFocus
        />

        <label className="block text-sm font-medium mb-1">
          {t("chorists.lastName")}
        </label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="border border-border rounded px-3 py-2 text-sm w-full mb-4"
        />

        <label className="flex items-center gap-2 text-sm mb-4">
          <input
            type="checkbox"
            checked={sectionLeader}
            onChange={(e) => setSectionLeader(e.target.checked)}
          />
          {t("chorists.sectionLeader")}
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
                className="border border-border rounded px-3 py-2 text-sm w-full bg-surface"
              >
                <option value="">{t("common.unassigned")}</option>
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
                className="text-sm text-danger hover:text-danger-hover"
              >
                {t("chorists.archive")}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-muted hover:text-foreground"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-2 btn-primary text-sm font-medium"
            >
              {mode === "add" ? t("common.add") : t("common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
