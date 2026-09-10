"use client";

import { useState } from "react";

type Formation = { id: string; name: string; sortOrder: number };

type Props = {
  open: boolean;
  onClose: () => void;
  formations: Formation[];
  songFormationIds: Set<string>;
  onCreateNew: (name: string) => void;
  onReuse: (formationId: string) => void;
};

export default function AddFormationModal({
  open,
  onClose,
  formations,
  songFormationIds,
  onCreateNew,
  onReuse,
}: Props) {
  const [newName, setNewName] = useState("");

  if (!open) return null;

  const reusable = formations.filter((f) => !songFormationIds.has(f.id));

  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-80 flex flex-col">
        <h2 className="font-bold mb-4">Add Formation</h2>

        <h3 className="text-sm font-medium mb-2">New empty formation</h3>
        <div className="flex gap-1 mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && newName.trim() && onCreateNew(newName.trim())
            }
            placeholder="Formation name"
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <button
            onClick={() => {
              if (newName.trim()) onCreateNew(newName.trim());
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Create
          </button>
        </div>

        {reusable.length > 0 && (
          <>
            <h3 className="text-sm font-medium mb-2">
              Reuse from this concert
            </h3>
            <ul className="space-y-1 mb-4 max-h-40 overflow-y-auto">
              {reusable.map((f) => (
                <li
                  key={f.id}
                  onClick={() => onReuse(f.id)}
                  className="text-sm py-1 px-2 rounded hover:bg-gray-100 cursor-pointer"
                >
                  {f.name}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
