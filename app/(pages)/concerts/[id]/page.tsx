"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useConcertEditor } from "../../../hooks/useConcertEditor";
import GridCanvas from "../../../components/concert/GridCanvas";
import RosterPanel from "../../../components/concert/RosterPanel";
import RosterModal from "../../../components/concert/RosterModal";
import FormationBar from "../../../components/concert/FormationBar";
import VoiceGroupPanel from "../../../components/concert/VoiceGroupPanel";
import SetlistDrawer, {
  SetlistNavButtons,
} from "../../../components/concert/SetlistDrawer";
import EditSetlistModal from "../../../components/concert/EditSetlistModal";
import Link from "next/link";
import {
  ArrowBigLeft,
  SquareMenu,
  UsersRound,
  UserRoundGroup,
} from "lucide-react";
import { useTranslation } from "../../../lib/LanguageContext";

const DRAWER_WIDTH = 288; // w-72 = 18rem = 288px

export default function ConcertEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();
  const editor = useConcertEditor(id);
  const leftOpen = editor.showSetlist || editor.showChorists;
  const rightOpen = editor.showFormations;

  // Track full window size (the "virtual" coordinate space)
  const [windowSize, setWindowSize] = useState({ width: 1600, height: 734 });
  const isDesktop = windowSize.width >= 768; // md breakpoint

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
        <>
          {/* Mobile backdrop */}
          {!isDesktop && (
            <div
              className="absolute inset-0 bg-overlay z-10"
              onClick={() => {
                editor.setShowSetlist(false);
                editor.setShowChorists(false);
              }}
            />
          )}
          <div className="absolute top-0 left-0 w-72 h-full bg-surface shadow-lg flex flex-col z-20">
            <div className="flex-1 overflow-y-auto p-4">
              {editor.showSetlist && (
                <SetlistDrawer
                  concertSongs={editor.concertSongs}
                  activeConcertSongId={editor.activeConcertSongId}
                  onSelectSong={editor.handleSelectConcertSong}
                  onEditSetlist={() => editor.setShowEditSetlist(true)}
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
        </>
      )}

      {/* Grid area — offset by open drawers on desktop, full-width on mobile */}
      <div
        className="absolute overflow-hidden flex"
        style={{
          top: 0,
          bottom: 0,
          left: isDesktop && leftOpen ? DRAWER_WIDTH : 0,
          right: isDesktop && rightOpen ? DRAWER_WIDTH : 0,
        }}
      >
        {/* Left toggle buttons — sits beside the canvas, not on top */}
        <div className="flex flex-col gap-2 p-2 pt-4 shrink-0">
          <Link
            href="/concerts"
            className="bg-surface rounded-lg shadow p-2 hover:bg-surface-alt text-center text-sm"
            title={t("concerts.backToConcerts")}
          >
            <ArrowBigLeft size={20} />
          </Link>
          <button
            className="bg-surface rounded-lg shadow p-2 hover:bg-surface-alt"
            onClick={() => {
              editor.setShowSetlist(!editor.showSetlist);
              editor.setShowChorists(false);
            }}
          >
            <SquareMenu size={20} />
          </button>
          <button
            className="bg-surface rounded-lg shadow p-2 hover:bg-surface-alt"
            onClick={() => {
              editor.setShowChorists(!editor.showChorists);
              editor.setShowSetlist(false);
            }}
          >
            <UsersRound size={20} />
          </button>
        </div>

        {/* Canvas container — fills remaining space */}
        <div
          ref={canvasContainerRef}
          className="flex-1 min-w-0 overflow-hidden relative"
        >
          {/* Concert name — centered above the grid */}
          {editor.concertName && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 text-sm font-medium text-muted">
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
            activeFormationId={editor.activeFormationId}
          />
        </div>

        {/* Right toggle button — sits beside the canvas, not on top */}
        <div className="flex flex-col gap-2 p-2 pt-4 shrink-0">
          <button
            className="bg-surface rounded-lg shadow p-2 hover:bg-surface-alt"
            onClick={() => editor.setShowFormations(!editor.showFormations)}
          >
            <UserRoundGroup size={20} />
          </button>
        </div>
      </div>

      {/* Right drawer */}
      {editor.showFormations && (
        <>
          {!isDesktop && (
            <div
              className="absolute inset-0 bg-overlay z-10"
              onClick={() => editor.setShowFormations(false)}
            />
          )}
          <div className="absolute top-0 right-0 w-72 h-full bg-surface shadow-lg p-4 overflow-y-auto z-20">
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
        </>
      )}
      {/* Bottom navigation bar — visible when a formation is selected and setlist drawer is closed */}
      {!editor.showSetlist && editor.activeFormationId && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 py-2 bg-surface/90 border-t border-border">
          <span className="text-sm font-medium text-foreground">
            {
              editor.concertSongs.find(
                (s) => s.id === editor.activeConcertSongId,
              )?.name
            }
          </span>
          <SetlistNavButtons
            onPrev={editor.handlePrevFormation}
            onNext={editor.handleNextFormation}
            hasPrev={editor.hasPrevFormation}
            hasNext={editor.hasNextFormation}
            className="flex gap-2"
          />
          <span className="text-sm text-foreground">
            {editor.formationName}
          </span>
        </div>
      )}

      {editor.showRosterModal && (
        <RosterModal
          onClose={() => editor.setShowRosterModal(false)}
          chorists={editor.sortedChorists}
          rosterIds={editor.rosterIds}
          onSave={editor.handleSaveRoster}
        />
      )}

      {editor.showEditSetlist && (
        <EditSetlistModal
          concertId={id}
          catalogSongs={editor.catalogSongs}
          concertSongs={editor.concertSongs}
          onSongsChange={editor.setConcertSongs}
          onClose={() => editor.setShowEditSetlist(false)}
        />
      )}
    </div>
  );
}
