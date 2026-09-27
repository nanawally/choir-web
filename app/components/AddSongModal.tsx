"use client";

import { useState } from "react";
import type { Song } from "../lib/api";
import { SongFormFields } from "./SongFormFields";

const EMPTY_SONG: Song = {
  id: "",
  name: "",
  composer: null,
  arranger: null,
  delning: null,
  languages: null,
  length: null,
  accompanied: null,
  instrument: null,
  year: null,
  collectionName: null,
  hasSoloists: null,
  soloistNames: null,
  hasSheetMusic: false,
  hasSheetMusicFile: false,
};

export default function AddSongModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (fields: Omit<Song, "id" | "hasSheetMusicFile">) => void;
}) {
  const [form, setForm] = useState<Song>({ ...EMPTY_SONG });

  function set<K extends keyof Song>(key: K, value: Song[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const { id, hasSheetMusicFile, ...fields } = form;
    onCreate(fields);
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Add Song</h2>
        <SongFormFields form={form} set={set} />
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-1.5 border border-gray-300 rounded text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-500 text-white rounded text-sm"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
