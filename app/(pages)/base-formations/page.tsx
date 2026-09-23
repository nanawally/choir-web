"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listBaseFormations,
  createBaseFormation,
  deleteFormation,
  renameFormation,
} from "../../lib/api";

type BaseFormation = { id: string; name: string };

export default function BaseFormationsPage() {
  const [formations, setFormations] = useState<BaseFormation[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    listBaseFormations().then(setFormations);
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    const f = await createBaseFormation(newName.trim());
    if (f) {
      setFormations([...formations, f]);
      setNewName("");
      setShowAdd(false);
    }
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    if (await renameFormation(id, renameValue.trim())) {
      setFormations(
        formations.map((f) =>
          f.id === id ? { ...f, name: renameValue.trim() } : f,
        ),
      );
    }
    setRenamingId(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this base formation and all its placements?"))
      return;
    if (await deleteFormation(id)) {
      setFormations(formations.filter((f) => f.id !== id));
    }
  }

  return (
    <div className="flex flex-col min-h-screen py-8 px-8">
      <Link
        href="/"
        className="self-start text-sm text-blue-500 hover:underline mb-4"
      >
        &larr; Home
      </Link>
      <h1 className="text-4xl font-bold mb-6">Base Formations</h1>

      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            Base formations are templates that can be copied into concerts.
          </span>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium flex-shrink-0 ml-4"
          >
            + New base formation
          </button>
        </div>

        {showAdd && (
          <div className="flex items-center gap-2 mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowAdd(false);
                  setNewName("");
                }
              }}
              placeholder="Formation name..."
              className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setNewName("");
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="space-y-2">
          {formations.map((f) => (
            <div
              key={f.id}
              className="border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              {renamingId === f.id ? (
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(f.id);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="border border-gray-300 rounded px-2 py-0.5 text-sm"
                  autoFocus
                />
              ) : (
                <Link
                  href={`/base-formations/${f.id}`}
                  className="font-medium hover:text-blue-600"
                >
                  {f.name}
                </Link>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRenamingId(f.id);
                    setRenameValue(f.name);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {formations.length === 0 && !showAdd && (
          <p className="text-gray-400 text-sm text-center mt-8">
            No base formations yet.
          </p>
        )}
      </div>
    </div>
  );
}
