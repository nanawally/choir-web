"use client";

import { useEffect, useState } from "react";
import {
  listSongs,
  createSong,
  renameSong,
  deleteSong,
} from "../../lib/api";
import Link from "next/link";

type Song = { id: string; name: string };

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [newSongName, setNewSongName] = useState("");

  useEffect(() => {
    listSongs().then(setSongs);
  }, []);

  async function handleCreateSong() {
    if (!newSongName.trim()) return;
    const song = await createSong(newSongName.trim());
    if (song) {
      setSongs([...songs, song]);
      setNewSongName("");
    }
  }

  async function handleRenameSong(id: string, currentName: string) {
    const newName = window.prompt("Rename song:", currentName);
    if (!newName || newName === currentName) return;
    if (await renameSong(id, newName)) {
      setSongs(songs.map((s) => (s.id === id ? { ...s, name: newName } : s)));
    }
  }

  async function handleDeleteSong(id: string) {
    if (!window.confirm("Delete this song?")) return;
    if (await deleteSong(id)) {
      setSongs(songs.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-8">
      <h1 className="text-4xl font-bold mb-6">Songs</h1>

      <div className="flex gap-2 mb-6">
        <input
          value={newSongName}
          onChange={(e) => setNewSongName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateSong()}
          placeholder="New song"
          className="border border-gray-300 rounded px-2 py-1 text-sm w-48"
        />
        <button
          onClick={handleCreateSong}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Create
        </button>
      </div>

      <ul className="space-y-2 w-80">
        {songs.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between border border-gray-200 rounded p-3"
          >
            <Link
              href={`/songs/${s.id}`}
              className="font-medium hover:underline"
            >
              {s.name}
            </Link>
            <div className="flex gap-1">
                <button
                  onClick={() => handleRenameSong(s.id, s.name)}
                  className="px-1 py-1 bg-yellow-500 text-white rounded text-xs"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDeleteSong(s.id)}
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
