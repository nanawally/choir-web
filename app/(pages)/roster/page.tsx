"use client";

import { useEffect, useState } from "react";
import {
  listChorists,
  createChorist,
  renameChorist,
  deleteChorist,
} from "../../lib/api";

type Chorist = { id: string; name: string };

export default function Home() {
  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [newChoristName, setNewChoristName] = useState("");

  useEffect(() => {
    listChorists().then(setChorists);
  }, []);

  async function handleCreateChorist() {
    if (!newChoristName.trim()) return;
    const chorist = await createChorist(newChoristName.trim());
    if (chorist) {
      setChorists([...chorists, chorist]);
      setNewChoristName("");
    }
  }

  async function handleRenameChorist(id: string, currentName: string) {
    const newName = window.prompt("Rename chorist:", currentName);
    if (!newName || newName === currentName) return;
    if (await renameChorist(id, newName)) {
      setChorists(chorists.map((c) => (c.id === id ? { ...c, name: newName } : c)));
    }
  }

  async function handleDeleteChorist(id: string) {
    if (!window.confirm("Delete this chorist?")) return;
    if (await deleteChorist(id)) {
      setChorists(chorists.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-8">
      <h1 className="text-4xl font-bold mb-6">Chorists</h1>

      <div className="flex gap-2 mb-6">
        <input
          value={newChoristName}
          onChange={(e) => setNewChoristName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateChorist()}
          placeholder="New chorist"
          className="border border-gray-300 rounded px-2 py-1 text-sm w-48"
        />
        <button
          onClick={handleCreateChorist}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Create
        </button>
      </div>

      <ul className="space-y-2 w-80">
        {chorists.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between border border-gray-200 rounded p-3"
          >
            <span className="text-lg font-medium">
              {c.name}
            </span>
            <div className="flex gap-1">
                <button
                  onClick={() => handleRenameChorist(c.id, c.name)}
                  className="px-1 py-1 bg-yellow-500 text-white rounded text-xs"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDeleteChorist(c.id)}
                  className="px-1 py-1 bg-red-500 text-white rounded text-xs"
                >
                  Delete
                </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
