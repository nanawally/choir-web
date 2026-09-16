"use client";

import { use } from "react";
import { useConcertEditor } from "../../../hooks/useConcertEditor";
import { addSongToConcert, removeSongFromConcert } from "../../../lib/api";
import GridCanvas from "../../../components/GridCanvas";
import RosterPanel from "../../../components/RosterPanel";
import RosterModal from "@/app/components/RosterModal";
import FormationBar from "../../../components/FormationBar";
import VoiceGroupPanel from "../../../components/VoiceGroupPanel";

export default function ConcertEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const editor = useConcertEditor(id);

  return (
    <div className="relative w-full h-screen">
      <GridCanvas
        chorists={editor.rosterChorists}
        placements={editor.placements}
        setPlacements={editor.setPlacements}
        selectedIds={editor.selectedIds}
        setSelectedIds={editor.setSelectedIds}
        activeGroupId={editor.activeGroupId}
        voiceGroups={editor.voiceGroups}
        assignments={editor.assignments}
        highlightPartId={editor.highlightPartId}
        onRemove={editor.handleRemove}
        formationName={editor.formationName}
        hiddenIds={editor.hiddenIds}
        rowSizes={editor.rowSizes}
      />

      {/* Left toggle buttons */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 bg-white rounded-lg shadow p-2 hover:bg-gray-100">
        <button
          onClick={() => {
            editor.setShowSetlist(!editor.showSetlist);
            editor.setShowChorists(false);
          }}
        >
          ☰
        </button>
        <button
          onClick={() => {
            editor.setShowChorists(!editor.showChorists);
            editor.setShowSetlist(false);
          }}
        >
          👥
        </button>
      </div>

      {/* Right toggle button */}
      <div className="absolute top-4 right-4 z-20 bg-white rounded-lg shadow p-2 hover:bg-gray-100">
        <button
          onClick={() => editor.setShowFormations(!editor.showFormations)}
        >
          🎵
        </button>
      </div>

      {/* Left drawers */}
      {editor.showSetlist && (
        <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-lg z-10 p-4 pl-16">
          <h2 className="font-bold">Setlist</h2>
          <ul className="space-y-1 mb-4">
            {editor.concertSongs.map((s) => (
              <li
                key={s.id}
                className={`flex items-center justify-between text-sm py-0.5 px-2 rounded cursor-pointer ${editor.activeConcertSongId === s.id ? "bg-blue-100 font-semibold" : "hover:bg-gray-100"}`}
                onClick={() => editor.handleSelectConcertSong(s.id)}
              >
                {s.name}
                <button
                  className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded text-sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await removeSongFromConcert(id, s.id);
                    editor.setConcertSongs(
                      editor.concertSongs.filter((cs) => cs.id !== s.id),
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
              {editor.catalogSongs.map((s) => (
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
                editor.setConcertSongs([...editor.concertSongs, added]); // Appends the new entry to the setlist state so it appears in the list immediately
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
      {editor.showChorists && (
        <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-lg z-10 p-4 pl-16">
          <h2 className="font-bold">Chorists</h2>
          <button
            onClick={() => editor.setShowRosterModal(true)}
            className="m-4 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Edit Roster
          </button>
          <RosterPanel
            chorists={editor.rosterChorists}
            placedIds={editor.placedIds}
            onPlace={editor.handlePlace}
            hiddenIds={editor.hiddenIds}
            onToggleHidden={editor.handleToggleHidden}
          />
        </div>
      )}

      {/* Right drawer */}
      {editor.showFormations && (
        <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-lg z-10 p-4">
          <h2 className="font-bold">Formations</h2>
          <FormationBar
            concertId={id}
            placements={editor.placements}
            onLoad={editor.handleLoad}
            onFormationNameChange={editor.setFormationName}
            songFormationIds={editor.songFormationIds}
            activeConcertSongId={editor.activeConcertSongId}
            onSongFormationsChange={editor.setSongFormationIds}
            rowSizes={editor.rowSizes}
            onRowSizesChange={editor.setRowSizes}
            onClampPlacements={editor.handleClampPlacements}
          />
          <VoiceGroupPanel
            activeGroupId={editor.activeGroupId}
            onSelectGroup={editor.handleSelectGroup}
            voiceGroups={editor.voiceGroups}
            setVoiceGroups={editor.setVoiceGroups}
            highlightPartId={editor.highlightPartId}
            onHighlightPart={editor.setHighlightPartId}
          />
        </div>
      )}
      <RosterModal
        open={editor.showRosterModal}
        onClose={() => editor.setShowRosterModal(false)}
        chorists={editor.chorists}
        rosterIds={editor.rosterIds}
        onSave={editor.handleSaveRoster}
      />
    </div>
  );
}
