"use client";

import { addSongToConcert, removeSongFromConcert } from "../lib/api";

type Props = {
  concertId: string;
  concertSongs: { id: string; name: string; sortOrder: number }[];
  activeConcertSongId: string | null;
  catalogSongs: { id: string; name: string }[];
  onSelectSong: (id: string) => void;
  onSongsChange: (
    songs: { id: string; name: string; sortOrder: number }[],
  ) => void;
};

export default function SetlistDrawer({
  concertId,
  concertSongs,
  activeConcertSongId,
  catalogSongs,
  onSelectSong,
  onSongsChange,
}: Props) {
  return (
    <>
      <h2 className="font-bold  mb-3">Setlist</h2>
      <ul className="space-y-1 mb-4">
        {concertSongs.map((s) => (
          <li
            key={s.id}
            className={`flex items-center justify-between text-sm py-0.5 px-2 rounded cursor-pointer ${activeConcertSongId === s.id ? "bg-blue-100 font-semibold" : "hover:bg-gray-100"}`}
            onClick={() => onSelectSong(s.id)}
          >
            {s.name}
            <button
              className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded text-sm"
              onClick={async (e) => {
                e.stopPropagation();
                await removeSongFromConcert(concertId, s.id);
                onSongsChange(concertSongs.filter((cs) => cs.id !== s.id));
              }}
            >
              X
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1 mt-2">
        <select
          id="add-song-select"
          className="flex-1 border border-gray-300 rounded px-1 py-0.5 text-sm"
        >
          {catalogSongs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option> // key: required by React for list rendering, value: the song's ID
          ))}
        </select>
        <button
          className="px-2 py-0.5 bg-blue-500 text-white rounded text-sm"
          onClick={async () => {
            const select = document.getElementById(
              "add-song-select",
            ) as HTMLSelectElement; //Grabs the <select> element by its id so we can read which song the user picked. as HTMLSelectElement tells TypeScript it's a select element (so .value is available)
            const songId = select.value; // The value of a <select> is the value attribute of whichever <option> is currently selected
            if (!songId) return; // Guard in case of no catalog songs (empty dropdown)
            const added = await addSongToConcert(concertId, songId); // Calls the API. id is the concert ID (from the page params). songId is what was selected. It returns the new ConcertSongDTO with its own id, name, and sortOrder
            onSongsChange([...concertSongs, added]); // Appends the new entry to the setlist state so it appears in the list immediately
          }}
        >
          Add
        </button>
      </div>
    </>
  );
}
