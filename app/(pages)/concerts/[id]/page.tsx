"use client";

import { use } from "react";
import { useConcertEditor } from "../../../hooks/useConcertEditor";
import GridCanvas from "../../../components/GridCanvas";
import RosterPanel from "../../../components/RosterPanel";
import RosterModal from "@/app/components/RosterModal";
import FormationBar from "../../../components/FormationBar";
import VoiceGroupPanel from "../../../components/VoiceGroupPanel";
import SetlistDrawer from "@/app/components/SetlistDrawer";

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
          <SetlistDrawer
            concertId={id}
            concertSongs={editor.concertSongs}
            activeConcertSongId={editor.activeConcertSongId}
            catalogSongs={editor.catalogSongs}
            onSelectSong={editor.handleSelectConcertSong}
            onSongsChange={editor.setConcertSongs}
          />
        </div>
      )}
      {editor.showChorists && (
        <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-lg z-10 p-4 pl-16">
          <RosterPanel
            chorists={editor.rosterChorists}
            placedIds={editor.placedIds}
            onPlace={editor.handlePlace}
            hiddenIds={editor.hiddenIds}
            onToggleHidden={editor.handleToggleHidden}
            onEditRoster={() => editor.setShowRosterModal(true)}
          />
        </div>
      )}

      {/* Right drawer */}
      {editor.showFormations && (
        <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-lg z-10 p-4">
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
