"use client";

import RosterPanel from "../../../components/RosterPanel";
import { use, useEffect, useState } from "react";
import { addSongToConcert, apiFetch, getAssignments, getHiddenChorists, listConcertChorists, listConcertSongs, listSongFormations, listSongs, listVoiceGroups, removeSongFromConcert, saveHiddenChorists, setConcertChorists } from "../../../lib/api";
import FormationBar from "../../../components/FormationBar";
import VoiceGroupPanel from "../../../components/VoiceGroupPanel";
import GridCanvas from "../../../components/GridCanvas";
import RosterModal from "@/app/components/RosterModal";

const CELL_SIZE = 50;
const WIDTH = 800;
const HEIGHT = 600;

type Chorist = { id: string; name: string };
type Placement = { choristId: string; x: number; y: number };

export default function ConcertEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<
    { choristId: string; voicePartId: string }[]
  >([]);
  const [highlightPartId, setHighlightPartId] = useState<string | null>(null);
  const [formationName, setFormationName] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [voiceGroups, setVoiceGroups] = useState<
    {
      id: string;
      name: string;
      parts: { id: string; name: string; color: string; shape: string }[];
    }[]
  >([]);
  const [showSetlist, setShowSetlist] = useState(false);
  const [showChorists, setShowChorists] = useState(false);
  const [showFormations, setShowFormations] = useState(false);
  const [concertSongs, setConcertSongs] = useState<{id: string; name: string; sortOrder: number}[]>([]);
  const [activeConcertSongId, setActiveConcertSongId] = useState<string | null>(null);
  const [catalogSongs, setCatalogSongs] = useState<{ id: string; name: string }[]>([]);
  const [rosterIds, setRosterIds] = useState<Set<string>>(new Set());
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [songFormationIds, setSongFormationIds] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    apiFetch("/chorists")
      .then((res) => res.json())
      .then(setChorists);
  }, []);

  useEffect(() => {
    listVoiceGroups().then(setVoiceGroups);
  }, []);

  useEffect(() => {
    if (activeGroupId) {
      getAssignments(activeGroupId).then(setAssignments);
    }
  }, [activeGroupId]);

  useEffect(() => {
    listConcertSongs(id).then(setConcertSongs);
  }, [id]);

  useEffect(() => {
    listSongs().then(setCatalogSongs);
  }, []);

  useEffect(() => {
    listConcertChorists(id).then((ids: string[]) => setRosterIds(new Set(ids)));
  }, [id]);
  
  function handleSelectGroup(id: string | null) {
    setActiveGroupId(id);
    setHighlightPartId(null);
    if (!id) setAssignments([]);
  }

  const placedIds = new Set(placements.map((p) => p.choristId));
  const rosterChorists = chorists.filter((c) => rosterIds.has(c.id));
  
  async function handleSelectConcertSong(concertSongId: string) {
    setActiveConcertSongId(concertSongId);
    const hidden = await getHiddenChorists(concertSongId);
    setHiddenIds(new Set(hidden));
    const formationIds = await listSongFormations(concertSongId);
    setSongFormationIds(new Set(formationIds));
  }

  async function handleToggleHidden(newHiddenIds: Set<string>) {
    setHiddenIds(newHiddenIds);
    if (activeConcertSongId) {
      await saveHiddenChorists(activeConcertSongId, Array.from(newHiddenIds));
    }
  }

  async function handleSaveRoster(ids: Set<string>) {
    await setConcertChorists(id, Array.from(ids));
    setRosterIds(ids);
  }

  function handlePlace(choristId: string) {
    const occupied = new Set(placements.map((p) => `${p.x},${p.y}`));
    for (let y = CELL_SIZE; y < HEIGHT; y += CELL_SIZE) {
      for (let x = CELL_SIZE; x < WIDTH; x += CELL_SIZE) {
        if (!occupied.has(`${x},${y}`)) {
          setPlacements([...placements, { choristId, x, y }]);
          return;
        }
      }
    }
  }

  function handleRemove(choristId: string) {
    setPlacements(placements.filter((p) => p.choristId !== choristId));
  }

  function handleLoad(
    loaded: { choristId: string; gridX: number; gridY: number }[],
    hidden: string[],
  ) {
    setPlacements(
      loaded.map((p) => ({ choristId: p.choristId, x: p.gridX, y: p.gridY })),
    );
    setHiddenIds(new Set(hidden));
  }

  return (
    <div className="relative w-full h-screen">
      <GridCanvas
        chorists={rosterChorists}
        placements={placements}
        setPlacements={setPlacements}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        activeGroupId={activeGroupId}
        voiceGroups={voiceGroups}
        assignments={assignments}
        highlightPartId={highlightPartId}
        onRemove={handleRemove}
        formationName={formationName}
        hiddenIds={hiddenIds}
      />

      {/* Left toggle buttons */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 bg-white rounded-lg shadow p-2 hover:bg-gray-100">
        <button onClick={() => setShowSetlist(!showSetlist)}>☰</button>
        <button onClick={() => setShowChorists(!showChorists)}>👥</button>
      </div>

      {/* Right toggle button */}
      <div className="absolute top-4 right-4 z-20 bg-white rounded-lg shadow p-2 hover:bg-gray-100">
        <button onClick={() => setShowFormations(!showFormations)}>🎵</button>
      </div>

      {/* Left drawers */}
      {showSetlist && (
        <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-lg z-10 p-4">
          <h2 className="font-bold">Setlist</h2>
          <ul className="space-y-1 mb-4">
            {concertSongs.map((s) => (
              <li
                key={s.id}
                className={`flex items-center justify-between text-sm py-0.5 px-2 rounded cursor-pointer ${activeConcertSongId === s.id ? "bg-blue-100 font-semibold" : "hover:bg-gray-100"}`}
                onClick={() => handleSelectConcertSong(s.id)}
              >
                {s.name}
                <button
                  className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded text-sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await removeSongFromConcert(id, s.id);
                    setConcertSongs(
                      concertSongs.filter((cs) => cs.id !== s.id),
                    );
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
                const added = await addSongToConcert(id, songId); // Calls the API. id is the concert ID (from the page params). songId is what was selected. It returns the new ConcertSongDTO with its own id, name, and sortOrder
                setConcertSongs([...concertSongs, added]); // Appends the new entry to the setlist state so it appears in the list immediately
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
      {showChorists && (
        <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-lg z-10">
          <h2 className="font-bold">Chorists</h2>
          <button
            onClick={() => setShowRosterModal(true)}
            className="m-4 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Edit Roster
          </button>
          <RosterPanel
            chorists={rosterChorists}
            placedIds={placedIds}
            onPlace={handlePlace}
            hiddenIds={hiddenIds}
            onToggleHidden={handleToggleHidden}
          />
        </div>
      )}

      {/* Right drawer */}
      {showFormations && (
        <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-lg z-10 p-4">
          <h2 className="font-bold">Formations</h2>
          <FormationBar
            concertId={id}
            placements={placements}
            hiddenIds={hiddenIds}
            onLoad={handleLoad}
            onFormationNameChange={setFormationName}
            songFormationIds={songFormationIds}
            activeConcertSongId={activeConcertSongId}
            onSongFormationsChange={setSongFormationIds}
          />
          <VoiceGroupPanel
            activeGroupId={activeGroupId}
            onSelectGroup={handleSelectGroup}
            voiceGroups={voiceGroups}
            setVoiceGroups={setVoiceGroups}
            highlightPartId={highlightPartId}
            onHighlightPart={setHighlightPartId}
          />
        </div>
      )}
      <RosterModal
        open={showRosterModal}
        onClose={() => setShowRosterModal(false)}
        chorists={chorists}
        rosterIds={rosterIds}
        onSave={handleSaveRoster}
      />
    </div>
  );
}
