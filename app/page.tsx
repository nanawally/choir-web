"use client";

import RosterPanel from "./components/RosterPanel";
import { useEffect, useState } from "react";
import { apiFetch, getAssignments, listVoiceGroups } from "./lib/api";
import FormationBar from "./components/FormationBar";
import VoiceGroupPanel from "./components/VoiceGroupPanel";
import GridCanvas from "./components/GridCanvas";

const CELL_SIZE = 50;
const WIDTH = 800;
const HEIGHT = 600;

type Chorist = { id: string; name: string };
type Placement = { choristId: string; x: number; y: number };

export default function Home() {
  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<
    { choristId: string; voicePartId: string }[]
  >([]);
  const [highlightPartId, setHighlightPartId] = useState<string | null>(null);
  const [voiceGroups, setVoiceGroups] = useState<
    {
      id: string;
      name: string;
      parts: { id: string; name: string; color: string; shape: string }[];
    }[]
  >([]);

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

  function handleSelectGroup(id: string | null) {
    setActiveGroupId(id);
    setHighlightPartId(null);
    if (!id) setAssignments([]);
  }

  const placedIds = new Set(placements.map((p) => p.choristId));

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
  ) {
    setPlacements(
      loaded.map((p) => ({ choristId: p.choristId, x: p.gridX, y: p.gridY })),
    );
  }

  return (
    <div className="flex h-screen">
      <RosterPanel
        chorists={chorists}
        setChorists={setChorists}
        placedIds={placedIds}
        onPlace={handlePlace}
        activeGroup={voiceGroups.find((g) => g.id === activeGroupId) ?? null}
        assignments={assignments}
        onAssignmentsChange={setAssignments}
      />
      <div className="flex flex-col flex-1">
        <FormationBar placements={placements} onLoad={handleLoad} />
        <GridCanvas
          chorists={chorists}
          placements={placements}
          setPlacements={setPlacements}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          activeGroupId={activeGroupId}
          voiceGroups={voiceGroups}
          assignments={assignments}
          highlightPartId={highlightPartId}
          onRemove={handleRemove}
        />
      </div>
      <VoiceGroupPanel
        activeGroupId={activeGroupId}
        onSelectGroup={handleSelectGroup}
        voiceGroups={voiceGroups}
        setVoiceGroups={setVoiceGroups}
        highlightPartId={highlightPartId}
        onHighlightPart={setHighlightPartId}
      />
    </div>
  );
}
