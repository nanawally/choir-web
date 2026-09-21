"use client";

import { useEffect, useState } from "react";

type Chorist = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  chorists: Chorist[];
  rosterIds: Set<string>;
  onSave: (ids: Set<string>) => void;
};

export default function RosterModal({
  open,
  onClose,
  chorists,
  rosterIds,
  onSave,
}: Props) {
  const [localIds, setLocalIds] = useState<Set<string>>(new Set());

  // Re-sync localIds every time the modal opens
  // If roster is empty (new concert), pre-select all chorists — easier to uncheck a few than to check 35
  useEffect(() => {
    if (open) {
      setLocalIds(
        rosterIds.size > 0 ? new Set(rosterIds) : new Set(chorists.map((c) => c.id)),
      );
    }
  }, [open, rosterIds, chorists]);

  if (!open) return null;

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
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-80 max-h-[80vh] flex flex-col">
        <h2 className="font-bold mb-4">Concert Roster</h2>
        <ul className="space-y-1 overflow-y-auto flex-1 mb-4">
          {chorists.map((c) => (
            <li key={c.id}>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={localIds.has(c.id)}
                  onChange={() => toggle(c.id)}
                />
                {c.name}
              </label>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(localIds);
              onClose();
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
