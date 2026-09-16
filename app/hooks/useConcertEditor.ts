import { useEffect, useState } from "react";
import {
  apiFetch,
  getAssignments,
  getHiddenChorists,
  listConcertChorists,
  listConcertSongs,
  listSongFormations,
  listSongs,
  listVoiceGroups,
  saveHiddenChorists,
  setConcertChorists,
} from "../lib/api";

const CELL_SIZE = 50;
const WIDTH = 800;
const HEIGHT = 600;

type Chorist = { id: string; name: string };
type Placement = { choristId: string; gridX: number; gridY: number };

export function useConcertEditor(concertId: string) {
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
  const [concertSongs, setConcertSongs] = useState<
    { id: string; name: string; sortOrder: number }[]
  >([]);
  const [activeConcertSongId, setActiveConcertSongId] = useState<string | null>(
    null,
  );
  const [catalogSongs, setCatalogSongs] = useState<
    { id: string; name: string }[]
  >([]);
  const [rosterIds, setRosterIds] = useState<Set<string>>(new Set());
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [songFormationIds, setSongFormationIds] = useState<Set<string>>(
    new Set(),
  );
  const [rowSizes, setRowSizes] = useState<number[]>([]);

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
    listConcertSongs(concertId).then(setConcertSongs);
  }, [concertId]);

  useEffect(() => {
    listSongs().then(setCatalogSongs);
  }, []);

  useEffect(() => {
    listConcertChorists(concertId).then((ids: string[]) =>
      setRosterIds(new Set(ids)),
    );
  }, [concertId]);

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
    await setConcertChorists(concertId, Array.from(ids));
    setRosterIds(ids);
  }

  function handlePlace(choristId: string) {
    const occupied = new Set(placements.map((p) => `${p.gridX},${p.gridY}`));
    for (let gridY = 1; gridY < HEIGHT / CELL_SIZE; gridY++) {
      for (let gridX = 1; gridX < WIDTH / CELL_SIZE; gridX++) {
        if (!occupied.has(`${gridX},${gridY}`)) {
          setPlacements([...placements, { choristId, gridX, gridY }]);
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
    loadedRowSizes: number[],
  ) {
    setPlacements(
      loaded.map((p) => ({
        choristId: p.choristId,
        gridX: p.gridX,
        gridY: p.gridY,
      })),
    );
    setHiddenIds(new Set(hidden));
    setRowSizes(loadedRowSizes);
  }

  function handleClampPlacements(rowIndex: number, newSize: number) {
    const onRow = placements.filter((p) => p.gridY === rowIndex);
    const notOnRow = placements.filter((p) => p.gridY !== rowIndex);

    // Separate into "still fits" and "out of bounds"
    const valid = onRow.filter((p) => p.gridX < newSize);
    const overflow = onRow.filter((p) => p.gridX >= newSize);

    // Track which gridX slots are taken
    const taken = new Set(valid.map((p) => p.gridX));

    // For each overflow chorist, find the highest free gridX (leftward from end)
    const clamped = overflow.map((p) => {
      for (let x = newSize - 1; x >= 0; x--) {
        if (!taken.has(x)) {
          taken.add(x);
          return { ...p, gridX: x };
        }
      }
      return p;
    });

    setPlacements([...notOnRow, ...valid, ...clamped]);
  }

  return {
    // State values
    chorists,
    placements,
    selectedIds,
    activeGroupId,
    assignments,
    highlightPartId,
    formationName,
    hiddenIds,
    voiceGroups,
    showSetlist,
    showChorists,
    showFormations,
    concertSongs,
    activeConcertSongId,
    catalogSongs,
    rosterIds,
    showRosterModal,
    songFormationIds,
    rowSizes,
    placedIds,
    rosterChorists,

    // Setters the UI needs directly
    setPlacements,
    setSelectedIds,
    setShowSetlist,
    setShowChorists,
    setShowFormations,
    setShowRosterModal,
    setConcertSongs,
    setSongFormationIds,
    setRowSizes,
    setVoiceGroups,

    // Handlers
    handleSelectGroup,
    handleSelectConcertSong,
    handleToggleHidden,
    handleSaveRoster,
    handlePlace,
    handleRemove,
    handleLoad,
    handleClampPlacements,
    setFormationName,
    setHighlightPartId,
  };
}
