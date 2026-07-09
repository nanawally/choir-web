"use client";

import { useEffect, useState } from "react";
import {
  listConcerts,
  createConcert,
  deleteConcert,
  duplicateConcert,
} from "./lib/api";
import Link from "next/link";

type Concert = { id: string; name: string };

export default function Home() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [newConcertName, setNewConcertName] = useState("");

  useEffect(() => {
    listConcerts().then(setConcerts);
  }, []);

  async function handleCreateConcert() {
    if (!newConcertName.trim()) return;
    const concert = await createConcert(newConcertName.trim());
    if (concert) {
      setConcerts([...concerts, concert]);
      setNewConcertName("");
    }
  }

  async function handleDeleteConcert(id: string) {
    if (!window.confirm("Delete this concert and all its formations?")) return;
    if (await deleteConcert(id)) {
      setConcerts(concerts.filter((c) => c.id !== id));
    }
  }

  async function handleDuplicateConcert(id: string) {
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
    <div className="flex flex-col items-center min-h-screen py-8">
      <h1 className="text-4xl font-bold mb-6">Concerts</h1>

      <div className="flex gap-2 mb-6">
        <input
          value={newConcertName}
          onChange={(e) => setNewConcertName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateConcert()}
          placeholder="New concert"
          className="border border-gray-300 rounded px-2 py-1 text-sm w-48"
        />
        <button
          onClick={handleCreateConcert}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Create
        </button>
      </div>

      <ul className="space-y-2 w-80">
        {concerts.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between border border-gray-200 rounded p-3"
          >
            <Link
              href={`/concerts/${c.id}`}
              className="font-medium hover:underline"
            >
              {c.name}
            </Link>
            <div className="flex gap-1">
              <button
                onClick={() => handleDuplicateConcert(c.id)}
                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
              >
                Duplicate
              </button>
              <button
                onClick={() => handleDeleteConcert(c.id)}
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
