"use client";

import { useState } from "react";
import { SquarePen, UserPlus, Clock, Check } from "lucide-react";
import {
  createChorist,
  updateChorist,
  assignChorist,
  unassignChorist,
  archiveChorist,
  createChoristAccount,
  getTokenRole,
} from "../../lib/api";
import { sortVoiceGroups } from "../../lib/voiceGroupSort";
import { useTranslation } from "../../lib/LanguageContext";
import { usePermissions } from "../../lib/usePermissions";
import AccountQrModal from "./AccountQrModal";

type Chorist = {
  id: string;
  firstName: string;
  lastName: string;
  isSectionLeader: boolean;
  isArchived: boolean;
  notes: string | null;
  accountStatus: "none" | "pending" | "active" | null;
};

type VoicePart = { id: string; name: string; color: string; shape: string };
type VoiceGroup = {
  id: string;
  name: string;
  isStandard: boolean;
  parts: VoicePart[];
};

type ChoristModalProps = {
  mode: "add" | "view";
  chorist?: Chorist;
  voiceGroups: VoiceGroup[];
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
  const { canView, canEdit: canEditPerm, canDelete: canDeletePerm } = usePermissions();
  const isAdmin = getTokenRole() === "admin";
  const [editing, setEditing] = useState(mode === "add");
  const [qrData, setQrData] = useState<{ username: string; setupToken: string } | null>(null);
  const [firstName, setFirstName] = useState(chorist?.firstName ?? "");
  const [lastName, setLastName] = useState(chorist?.lastName ?? "");
  const [sectionLeader, setSectionLeader] = useState(chorist?.isSectionLeader ?? false);
  const [notes, setNotes] = useState(chorist?.notes ?? "");
  const [parts, setParts] = useState<Record<string, string>>(
    mode === "view" ? currentParts : {},
  );

  // Keep "current" state for reverting on cancel
  const [current, setCurrent] = useState({
    firstName: chorist?.firstName ?? "",
    lastName: chorist?.lastName ?? "",
    isSectionLeader: chorist?.isSectionLeader ?? false,
    notes: chorist?.notes ?? "",
    parts: mode === "view" ? { ...currentParts } : {} as Record<string, string>,
  });

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
      onSaved();
    } else if (chorist) {
      await updateChorist(
        chorist.id,
        firstName.trim(),
        lastName.trim(),
        sectionLeader,
        notes.trim() || null,
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
      setCurrent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isSectionLeader: sectionLeader,
        notes: notes.trim(),
        parts: { ...parts },
      });
      setEditing(false);
      onSaved();
    }
  }

  function handleCancel() {
    if (mode === "add") {
      onClose();
      return;
    }
    setFirstName(current.firstName);
    setLastName(current.lastName);
    setSectionLeader(current.isSectionLeader);
    setNotes(current.notes);
    setParts({ ...current.parts });
    setEditing(false);
  }

  async function handleArchive() {
    if (!chorist || !window.confirm(t("chorists.confirmArchive").replace("{name}", `${chorist.firstName} ${chorist.lastName}`))) return;
    await archiveChorist(chorist.id);
    onSaved();
  }

  const sorted = sortVoiceGroups(voiceGroups);
  const standardGroups = sorted.filter((g) => g.isStandard);
  const nonStandardGroups = sorted.filter((g) => !g.isStandard);
  const fourPartGroup = standardGroups.find(
    (g) => g.name.includes("4-part") || g.name.includes("4-stäm"),
  );
  const otherStandardGroups = standardGroups.filter((g) => g.id !== fourPartGroup?.id);

  function getPartName(groupId: string): string {
    const partId = (editing ? parts : current.parts)[groupId];
    if (!partId) return "—";
    const group = voiceGroups.find((g) => g.id === groupId);
    return group?.parts.find((p) => p.id === partId)?.name ?? "—";
  }

  // Read-only view
  if (!editing && chorist) {
    return (
      <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="bg-surface rounded-lg shadow-lg p-6 w-[calc(100%-2rem)] md:w-[50vw] max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                {current.firstName} {current.lastName}
              </h2>
              {current.isSectionLeader && (
                <p className="text-xs text-muted">{t("chorists.sectionLeaderTooltip")}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && chorist.accountStatus === "none" && (
                <button
                  onClick={async () => {
                    const data = await createChoristAccount(chorist.id);
                    if (data) setQrData(data);
                  }}
                  className="text-subtle hover:text-muted"
                  title={t("chorists.createAccount")}
                >
                  <UserPlus size={16} />
                </button>
              )}
              {isAdmin && chorist.accountStatus === "pending" && (
                <span className="text-warning-text" title={t("chorists.accountPending")}>
                  <Clock size={14} />
                </span>
              )}
              {isAdmin && chorist.accountStatus === "active" && (
                <span className="text-success" title={t("chorists.accountActive")}>
                  <Check size={14} />
                </span>
              )}
              {canEditPerm("chorists") && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-subtle hover:text-muted"
                  title={t("common.edit")}
                >
                  <SquarePen size={16} />
                </button>
              )}
            </div>
          </div>
          {qrData && (
            <AccountQrModal
              username={qrData.username}
              setupToken={qrData.setupToken}
              onClose={() => { setQrData(null); onSaved(); }}
            />
          )}

          <div className="flex gap-6">
            {/* Left: voice groups */}
            <div className="flex-1 min-w-0">
              {fourPartGroup && (
                <div className="mb-3">
                  <span className="block text-xs text-muted mb-0.5">{fourPartGroup.name}</span>
                  <span className="text-sm font-medium">{getPartName(fourPartGroup.id)}</span>
                </div>
              )}

              {otherStandardGroups.length > 0 && (
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-3">
                  {otherStandardGroups.map((group) => (
                    <div key={group.id}>
                      <span className="block text-xs text-muted mb-0.5">{group.name}</span>
                      <span className="text-sm font-medium">{getPartName(group.id)}</span>
                    </div>
                  ))}
                </div>
              )}

              {nonStandardGroups.length > 0 && (
                <>
                  <hr className="border-border my-3" />
                  <div className="space-y-2">
                    {nonStandardGroups.map((group) => (
                      <div key={group.id}>
                        <span className="block text-xs text-muted mb-0.5">{group.name}</span>
                        <span className="text-sm">{getPartName(group.id)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right: notes */}
            {canView("chorists_notes") && (
              <div className="w-1/3 border-l border-border pl-6">
                <span className="block text-xs text-muted mb-0.5">{t("chorists.notes")}</span>
                {current.notes && (
                  <p className="text-sm whitespace-pre-wrap">{current.notes}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit / Add form
  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-lg p-6 w-[calc(100%-2rem)] md:w-[50vw] max-h-[80vh] overflow-y-auto">
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

        {canEditPerm("chorists_notes") && (
          <>
            <label className="block text-sm font-medium mb-1">
              {t("chorists.notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border border-border rounded px-3 py-2 text-sm w-full mb-4"
              rows={2}
              placeholder={t("chorists.notesPlaceholder")}
            />
          </>
        )}

        <div className="space-y-3 mb-6">
          {sorted.map((group) => (
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
            {mode === "view" && canDeletePerm("chorists") && (
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
              onClick={handleCancel}
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
