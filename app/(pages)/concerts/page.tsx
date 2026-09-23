"use client";

import { useEffect, useState } from "react";
import {
  listConcerts,
  createConcert,
  updateConcert,
  deleteConcert,
  duplicateConcert,
} from "../../lib/api";
import Link from "next/link";

type Concert = { id: string; name: string; date: string | null; imageUrl: string | null };

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function ConcertsPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");

  useEffect(() => {
    listConcerts().then(setConcerts);
  }, []);

  // Sort by date descending (latest first), nulls last
  const sorted = [...concerts].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.name.localeCompare(b.name);
  });

  async function handleCreate() {
    if (!newName.trim()) return;
    const concert = await createConcert(newName.trim(), newDate || null);
    if (concert) {
      setConcerts([...concerts, concert]);
      setNewName("");
      setNewDate("");
      setShowAdd(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    if (await updateConcert(id, editName.trim(), editDate || null)) {
      setConcerts(
        concerts.map((c) =>
          c.id === id
            ? { ...c, name: editName.trim(), date: editDate || null }
            : c,
        ),
      );
    }
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this concert and all its formations?")) return;
    if (await deleteConcert(id)) {
      setConcerts(concerts.filter((c) => c.id !== id));
    }
  }

  async function handleDuplicate(id: string) {
    const original = concerts.find((c) => c.id === id);
    const name = window.prompt(
      "Name for the copy:",
      (original?.name ?? "") + " (copy)",
    );
    if (!name) return;
    const concert = await duplicateConcert(id, name);
    if (concert) {
      setConcerts([...concerts, concert]);
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
      <h1 className="text-4xl font-bold mb-6 text-center">Concerts</h1>

      <div className="mx-auto w-full max-w-4xl">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium"
          >
            + New concert
          </button>
        </div>

        {showAdd && (
          <div className="flex items-center gap-2 mb-6 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowAdd(false);
                  setNewName("");
                  setNewDate("");
                }
              }}
              placeholder="Concert name..."
              className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
              autoFocus
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
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
                setNewDate("");
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {sorted.map((c) => (
            <div
              key={c.id}
              className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative"
            >
              {/* Image area */}
              <Link href={`/concerts/${c.id}`}>
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-300 text-4xl">♪</span>
                  )}
                </div>
              </Link>

              {/* Info area */}
              <div className="p-3">
                {editingId === c.id ? (
                  <div className="flex flex-col gap-1">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(c.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="border border-gray-300 rounded px-2 py-0.5 text-sm font-semibold"
                      autoFocus
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-0.5 text-sm"
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => handleUpdate(c.id)}
                        className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-0.5 border border-gray-300 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link href={`/concerts/${c.id}`}>
                      <h2 className="font-semibold text-sm hover:text-blue-600 text-center">
                        {c.name}
                      </h2>
                    </Link>
                    {c.date && (
                      <p className="text-xs text-gray-400 mt-0.5 text-center">
                        {formatDate(c.date)}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Action buttons — visible on hover */}
              {editingId !== c.id && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                      setEditDate(c.date || "");
                    }}
                    className="px-1.5 py-0.5 bg-white/90 border border-gray-300 rounded text-xs shadow-sm"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(c.id)}
                    className="px-1.5 py-0.5 bg-white/90 border border-gray-300 rounded text-xs shadow-sm"
                    title="Duplicate"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="px-1.5 py-0.5 bg-red-500 text-white rounded text-xs shadow-sm"
                    title="Delete"
                  >
                    X
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {concerts.length === 0 && !showAdd && (
          <p className="text-gray-400 text-sm text-center mt-8">
            No concerts yet.
          </p>
        )}
      </div>
    </div>
  );
}
