"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useConcertEditor } from "../../../hooks/useConcertEditor";
import GridCanvas from "../../../components/GridCanvas";
import RosterPanel from "../../../components/RosterPanel";
import RosterModal from "@/app/components/RosterModal";
import FormationBar from "../../../components/FormationBar";
import VoiceGroupPanel from "../../../components/VoiceGroupPanel";
import SetlistDrawer, { SetlistNavButtons } from "@/app/components/SetlistDrawer";
import Link from "next/link";

const DRAWER_WIDTH = 288; // w-72 = 18rem = 288px

export default function ConcertEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const editor = useConcertEditor(id);
  const leftOpen = editor.showSetlist || editor.showChorists;
  const rightOpen = editor.showFormations;

  // Track full window size (the "virtual" coordinate space)
  const [windowSize, setWindowSize] = useState({ width: 1600, height: 734 });

  useEffect(() => {
    function onResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Measure the canvas container so button strips can take their natural width
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(windowSize.width);

  const updateCanvasWidth = useCallback(() => {
    if (canvasContainerRef.current) {
      setCanvasWidth(canvasContainerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateCanvasWidth());
    ro.observe(el);
    updateCanvasWidth(); // measure immediately
    return () => ro.disconnect();
  }, [updateCanvasWidth]);

  const canvasHeight = windowSize.height;
  
  // Scale factor: how much to shrink the virtual space to fit
  const scale = canvasWidth / windowSize.width;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Left drawers */}
      {(editor.showSetlist || editor.showChorists) && (
        <div className="absolute top-0 left-0 w-72 h-full bg-white shadow-lg flex flex-col z-10">
          <div className="flex-1 overflow-y-auto p-4">
            {editor.showSetlist && (
              <SetlistDrawer
                concertId={id}
                concertSongs={editor.concertSongs}
                activeConcertSongId={editor.activeConcertSongId}
                catalogSongs={editor.catalogSongs}
                onSelectSong={editor.handleSelectConcertSong}
                onSongsChange={editor.setConcertSongs}
                getFormationsForSong={editor.getFormationsForSong}
                activeFormationId={editor.activeFormationId}
                onSelectFormation={editor.handleSelectFormation}
                onReorderFormations={editor.handleReorderFormations}
              />
            )}
            {editor.showChorists && (
              <RosterPanel
                chorists={editor.rosterChorists}
                placedIds={editor.placedIds}
                onPlace={editor.handlePlace}
                hiddenIds={editor.hiddenIds}
                onToggleHidden={editor.handleToggleHidden}
                onEditRoster={() => editor.setShowRosterModal(true)}
              />
            )}
          </div>
          {editor.showSetlist && (
            <SetlistNavButtons
              onPrev={editor.handlePrevFormation}
              onNext={editor.handleNextFormation}
              hasPrev={editor.hasPrevFormation}
              hasNext={editor.hasNextFormation}
            />
          )}
        </div>
      )}

      {/* Grid area — offset by open drawers, uses flex so button strips take natural width */}
      <div
        className="absolute overflow-hidden flex"
        style={{
          top: 0,
          bottom: 0,
          left: leftOpen ? DRAWER_WIDTH : 0,
          right: rightOpen ? DRAWER_WIDTH : 0,
        }}
      >
        {/* Left toggle buttons — sits beside the canvas, not on top */}
        <div className="flex flex-col gap-2 p-2 pt-4 shrink-0">
          <Link
            href="/concerts"
            className="bg-white rounded-lg shadow p-2 hover:bg-gray-100 text-center text-sm"
            title="Back to concerts"
          >
            &larr;
          </Link>
          <button
            className="bg-white rounded-lg shadow p-2 hover:bg-gray-100"
            onClick={() => {
              editor.setShowSetlist(!editor.showSetlist);
              editor.setShowChorists(false);
            }}
          >
            ☰
          </button>
          <button
            className="bg-white rounded-lg shadow p-2 hover:bg-gray-100"
            onClick={() => {
              editor.setShowChorists(!editor.showChorists);
              editor.setShowSetlist(false);
            }}
          >
            👥
          </button>
        </div>

        {/* Canvas container — fills remaining space */}
        <div ref={canvasContainerRef} className="flex-1 min-w-0 overflow-hidden relative">
          {/* Concert name — centered above the grid */}
          {editor.concertName && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 text-sm font-medium text-gray-500">
              {editor.concertName}
            </div>
          )}
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
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            scale={scale}
            virtualWidth={windowSize.width}
            virtualHeight={windowSize.height}
          />
        </div>

        {/* Right toggle button — sits beside the canvas, not on top */}
        <div className="flex flex-col gap-2 p-2 pt-4 shrink-0">
          <button
            className="bg-white rounded-lg shadow p-2 hover:bg-gray-100"
            onClick={() => editor.setShowFormations(!editor.showFormations)}
          >
            🎵
          </button>
        </div>
      </div>

      {/* Right drawer */}
      {editor.showFormations && (
        <div className="absolute top-0 right-0 w-72 h-full bg-white shadow-lg p-4 overflow-y-auto z-10">
          <FormationBar
            concertId={id}
            placements={editor.placements}
            onLoad={editor.handleLoad}
            onFormationNameChange={editor.setFormationName}
            songFormationIds={editor.songFormationIds}
            activeConcertSongId={editor.activeConcertSongId}
            onSongFormationsChange={editor.updateSongFormationIds}
            rowSizes={editor.rowSizes}
            onRowSizesChange={editor.setRowSizes}
            onClampPlacements={editor.handleClampPlacements}
            activeFormationId={editor.activeFormationId}
            onActiveFormationIdChange={editor.setActiveFormationId}
            formationName={editor.formationName}
            formations={editor.formations}
            onFormationsChange={editor.setFormations}
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
