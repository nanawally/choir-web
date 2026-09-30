"use client";

import { useState } from "react";
import { useTranslation } from "../lib/LanguageContext";

type Chorist = { id: string; firstName: string; lastName: string };

type Props = {
  onClose: () => void;
  chorists: Chorist[];
  rosterIds: Set<string>;
  onSave: (ids: Set<string>) => void;
};

// If roster is empty (new concert), pre-select all chorists — easier to uncheck a few than to check 35
export default function RosterModal({
  onClose,
  chorists,
  rosterIds,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const [localIds, setLocalIds] = useState<Set<string>>(() =>
    rosterIds.size > 0
      ? new Set(rosterIds)
      : new Set(chorists.map((c) => c.id)),
  );

  function toggle(choristId: string) {
    const next = new Set(localIds);
    if (next.has(choristId)) {
      next.delete(choristId);
    } else {
      next.add(choristId);
    }
    setLocalIds(next);
  }

  return (
    <div className="fixed inset-0 bg-overlay z-30 flex items-center justify-center">
      <div className="bg-surface rounded-lg p-6 w-80 max-h-[80vh] flex flex-col">
        <h2 className="font-bold mb-4">{t("roster.title")}</h2>
        <ul className="space-y-1 overflow-y-auto flex-1 mb-4">
          {chorists.map((c) => (
            <li key={c.id}>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={localIds.has(c.id)}
                  onChange={() => toggle(c.id)}
                />
                {c.firstName} {c.lastName}
              </label>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded text-sm"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() => {
              onSave(localIds);
              onClose();
            }}
            className="px-3 py-1 btn-primary text-sm"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
