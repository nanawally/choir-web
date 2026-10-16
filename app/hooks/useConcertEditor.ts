import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../lib/LanguageContext";
import {
  apiFetch,
  getAssignments,
  listConcerts,
  getHiddenChorists,
  listConcertChorists,
  listConcertSongs,
  listFormations,
  listSongFormations,
  listSongs,
  listVoiceGroups,
  loadFormation,
  saveHiddenChorists,
  savePlacements,
  setConcertChorists,
  setSongFormations,
  deleteFormation,
} from "../lib/api";
import { sortChoristsByVoicePart } from "../lib/voiceGroupSort";

const CELL_SIZE = 50;
const WIDTH = 800;
const HEIGHT = 600;

type Chorist = { id: string; firstName: string; lastName: string; notes: string | null };
type Placement = { choristId: string; gridX: number; gridY: number };
type Formation = { id: string; name: string; sortOrder: number };
type CachedFormation = { placements: Placement[]; rowSizes: number[]; name: string };

export function useConcertEditor(concertId: string) {
  const { t } = useTranslation();
  const [concertName, setConcertName] = useState<string>("");
  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [placements, setPlacementsInternal] = useState<Placement[]>([]);
  const [pastPlacements, setPastPlacements] = useState<Placement[][]>([]);
  const [futurePlacements, setFuturePlacements] = useState<Placement[][]>([]);
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
      isStandard: boolean;
      parts: { id: string; name: string; color: string; shape: string }[];
    }[]
  >([]);
  const [showSetlist, setShowSetlist] = useState(false);
  const [showChorists, setShowChorists] = useState(false);
  const [showFormations, setShowFormations] = useState(false);
  const [concertSongs, setConcertSongs] = useState<
    { id: string; songId: string; name: string; sortOrder: number }[]
  >([]);
  const [activeConcertSongId, setActiveConcertSongId] = useState<string | null>(
    null,
  );
  const [catalogSongs, setCatalogSongs] = useState<
    { id: string; name: string; composer: string | null }[]
  >([]);
  const [rosterIds, setRosterIds] = useState<Set<string>>(new Set());
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showEditSetlist, setShowEditSetlist] = useState(false);
  const [songFormationIds, setSongFormationIds] = useState<Set<string>>(
    new Set(),
  );
  // Map of concertSongId → formation IDs for all songs (for setlist tags)
  const [allSongFormationIds, setAllSongFormationIds] = useState<
    Map<string, string[]>
  >(new Map());
  const [rowSizes, setRowSizes] = useState<number[]>([]);
  const [activeFormationId, setActiveFormationId] = useState<string | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [fourPartAssignments, setFourPartAssignments] = useState<
    { choristId: string; voicePartId: string }[]
  >([]);
  const formationCacheRef = useRef<Map<string, CachedFormation>>(new Map());

  // Auto-save
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);
  const latestActiveConcertSongIdRef = useRef(activeConcertSongId);
  const latestSongFormationIdsRef = useRef(songFormationIds);
  const latestRowSizesRef = useRef(rowSizes);
  const latestFormationNameRef = useRef(formationName);
  const latestPlacementsRef = useRef(placements);
  const latestActiveFormationIdRef = useRef(activeFormationId);
  useEffect(() => { latestPlacementsRef.current = placements; }, [placements]);
  useEffect(() => { latestActiveFormationIdRef.current = activeFormationId; }, [activeFormationId]);
  useEffect(() => { latestActiveConcertSongIdRef.current = activeConcertSongId; }, [activeConcertSongId]);
  useEffect(() => { latestSongFormationIdsRef.current = songFormationIds; }, [songFormationIds]);
  useEffect(() => { latestRowSizesRef.current = rowSizes; }, [rowSizes]);
  useEffect(() => { latestFormationNameRef.current = formationName; }, [formationName]);

  // Flush pending auto-save immediately (call before switching formations)
  async function flushPendingSave() {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
      const fId = latestActiveFormationIdRef.current;
      if (fId) {
        const p = latestPlacementsRef.current;
        await savePlacements(
          fId,
          p.map((pl) => ({ choristId: pl.choristId, gridX: pl.gridX, gridY: pl.gridY })),
        );
        formationCacheRef.current.set(fId, {
          placements: p.map((pl) => ({ choristId: pl.choristId, gridX: pl.gridX, gridY: pl.gridY })),
          rowSizes: latestRowSizesRef.current,
          name: latestFormationNameRef.current ?? "",
        });
      }
    }
  }

  useEffect(() => {
    apiFetch("/chorists")
      .then((res) => res.json())
      .then(setChorists);
  }, []);

  useEffect(() => {
    listConcerts().then((concerts: { id: string; name: string }[]) => {
      const concert = concerts.find((c) => c.id === concertId);
      if (concert) setConcertName(concert.name);
    });
  }, [concertId]);

  useEffect(() => {
    listVoiceGroups().then(setVoiceGroups);
  }, []);

  useEffect(() => {
    if (activeGroupId) {
      getAssignments(activeGroupId).then(setAssignments);
    }
  }, [activeGroupId]);

  // Fetch 4-part assignments for roster sorting
  useEffect(() => {
    const fourPart = voiceGroups.find(
      (g) => g.name.includes("4-part") || g.name.includes("4-stäm"),
    );
    if (fourPart) {
      getAssignments(fourPart.id).then(setFourPartAssignments);
    }
  }, [voiceGroups]);

  useEffect(() => {
    listConcertSongs(concertId).then(setConcertSongs);
  }, [concertId]);

  useEffect(() => {
    listSongs().then((songs) =>
      setCatalogSongs([...songs].sort((a, b) => a.name.localeCompare(b.name))),
    );
  }, []);

  useEffect(() => {
    listConcertChorists(concertId).then((ids: string[]) =>
      setRosterIds(new Set(ids)),
    );
  }, [concertId]);

  // Fetch all formations for this concert
  useEffect(() => {
    listFormations(concertId).then(setFormations);
  }, [concertId]);

  // Preload formation details into cache so navigation is instant
  useEffect(() => {
    formations.forEach((f) => {
      if (formationCacheRef.current.has(f.id)) return;
      loadFormation(f.id).then((data) => {
        if (!data) return;
        formationCacheRef.current.set(f.id, {
          placements: data.placements.map((p: Placement) => ({
            choristId: p.choristId, gridX: p.gridX, gridY: p.gridY,
          })),
          rowSizes: JSON.parse(data.rowSizes || "[]"),
          name: data.name,
        });
      });
    });
  }, [formations]);

  // Auto-save placements 500ms after the last change
  useEffect(() => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    if (!activeFormationId) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("idle");

    const capturedFormationId = activeFormationId;
    const capturedPlacements = placements;

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      await savePlacements(
        capturedFormationId,
        capturedPlacements.map((p) => ({ choristId: p.choristId, gridX: p.gridX, gridY: p.gridY })),
      );
      formationCacheRef.current.set(capturedFormationId, {
        placements: capturedPlacements.map((p) => ({ choristId: p.choristId, gridX: p.gridX, gridY: p.gridY })),
        rowSizes: latestRowSizesRef.current,
        name: latestFormationNameRef.current ?? "",
      });
      const songId = latestActiveConcertSongIdRef.current;
      const fIds = latestSongFormationIdsRef.current;
      if (songId && !fIds.has(capturedFormationId)) {
        const updatedIds = [...fIds, capturedFormationId];
        await setSongFormations(songId, updatedIds);
        setSongFormationIds(new Set(updatedIds));
        setAllSongFormationIds((prev) => {
          const next = new Map(prev);
          next.set(songId, updatedIds);
          return next;
        });
      }
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [placements, activeFormationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch formation links for all songs so tags are always visible
  useEffect(() => {
    if (concertSongs.length === 0) return;
    Promise.all(
      concertSongs.map(async (s) => {
        const ids = await listSongFormations(s.id);
        return [s.id, ids] as [string, string[]];
      }),
    ).then((entries) => setAllSongFormationIds(new Map(entries)));
  }, [concertSongs]);

  // Auto-select first song on initial load
  const hasAutoSelectedSongRef = useRef(false);
  useEffect(() => {
    if (hasAutoSelectedSongRef.current) return;
    if (concertSongs.length === 0) return;
    hasAutoSelectedSongRef.current = true;
    handleSelectConcertSong(concertSongs[0].id);
  }, [concertSongs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select 4-part voice group on initial load
  const hasAutoSelectedGroupRef = useRef(false);
  useEffect(() => {
    if (hasAutoSelectedGroupRef.current) return;
    if (voiceGroups.length === 0) return;
    const fourPart = voiceGroups.find(
      (g) => g.name.includes("4-part") || g.name.includes("4-stäm"),
    );
    if (fourPart) {
      hasAutoSelectedGroupRef.current = true;
      handleSelectGroup(fourPart.id);
    }
  }, [voiceGroups]); // eslint-disable-line react-hooks/exhaustive-deps

  // History-aware placement setter — use for all user-initiated changes
  function setPlacements(newPlacements: Placement[]) {
    setPastPlacements((prev) => [...prev.slice(-49), placements]);
    setFuturePlacements([]);
    setPlacementsInternal(newPlacements);
  }

  function undo() {
    if (pastPlacements.length === 0) return;
    const prev = pastPlacements[pastPlacements.length - 1];
    setFuturePlacements((f) => [placements, ...f.slice(0, 49)]);
    setPastPlacements((p) => p.slice(0, -1));
    setPlacementsInternal(prev);
  }

  function redo() {
    if (futurePlacements.length === 0) return;
    const next = futurePlacements[0];
    setPastPlacements((p) => [...p.slice(-49), placements]);
    setFuturePlacements((f) => f.slice(1));
    setPlacementsInternal(next);
  }

  function handleSelectGroup(id: string | null) {
    setActiveGroupId(id);
    setHighlightPartId(null);
    if (!id) setAssignments([]);
  }

  const placedIds = new Set(placements.map((p) => p.choristId));

  const fourPartGroup = voiceGroups.find(
    (g) => g.name.includes("4-part") || g.name.includes("4-stäm"),
  );
  const sortedChorists = sortChoristsByVoicePart(chorists, fourPartGroup, fourPartAssignments);
  const rosterChorists = sortedChorists.filter((c) => rosterIds.has(c.id));

  // Build a lookup: for each song, its formation objects (with names, in order)
  function getFormationsForSong(songId: string) {
    const ids = allSongFormationIds.get(songId) || [];
    // Map IDs to formation objects, preserving the stored order
    return ids
      .map((id) => formations.find((f) => f.id === id))
      .filter((f): f is Formation => f != null);
  }

  // Keep allSongFormationIds in sync when the active song's links change
  function updateSongFormationIds(newIds: Set<string>) {
    setSongFormationIds(newIds);
    if (activeConcertSongId) {
      setAllSongFormationIds((prev) => {
        const next = new Map(prev);
        next.set(activeConcertSongId, Array.from(newIds));
        return next;
      });
    }
  }

  // Reorder formations under a song (called after drag-and-drop)
  async function handleReorderFormations(songId: string, newOrder: string[]) {
    // Update the local map immediately for responsive UI
    setAllSongFormationIds((prev) => {
      const next = new Map(prev);
      next.set(songId, newOrder);
      return next;
    });
    // Also update songFormationIds if this is the active song
    if (songId === activeConcertSongId) {
      setSongFormationIds(new Set(newOrder));
    }
    // Persist to backend
    await setSongFormations(songId, newOrder);
  }

  async function handleSelectConcertSong(concertSongId: string) {
    setActiveConcertSongId(concertSongId);
    const hidden = await getHiddenChorists(concertSongId);
    setHiddenIds(new Set(hidden));
    const formationIds = await listSongFormations(concertSongId);
    setSongFormationIds(new Set(formationIds));

    // Auto-load the first linked formation onto the grid
    if (formationIds.length > 0) {
      await handleSelectFormation(formationIds[0]);
    } else {
      // Song has no linked formations — clear the grid
      await flushPendingSave();
      isSyncingRef.current = true;
      setPastPlacements([]);
      setFuturePlacements([]);
      setActiveFormationId(null);
      setPlacementsInternal([]);
      setRowSizes([]);
      setFormationName(null);
    }
  }

  // Load a specific formation onto the grid (used by setlist tags and auto-load)
  async function handleSelectFormation(formationId: string) {
    await flushPendingSave();
    const cached = formationCacheRef.current.get(formationId);
    if (cached) {
      isSyncingRef.current = true;
      setPastPlacements([]);
      setFuturePlacements([]);
      setActiveFormationId(formationId);
      setPlacementsInternal(cached.placements);
      setRowSizes(cached.rowSizes);
      setFormationName(cached.name);
      return;
    }
    const data = await loadFormation(formationId);
    if (data) {
      isSyncingRef.current = true;
      const entry: CachedFormation = {
        placements: data.placements.map((p: Placement) => ({
          choristId: p.choristId, gridX: p.gridX, gridY: p.gridY,
        })),
        rowSizes: JSON.parse(data.rowSizes || "[]"),
        name: data.name,
      };
      formationCacheRef.current.set(formationId, entry);
      setPastPlacements([]);
      setFuturePlacements([]);
      setActiveFormationId(formationId);
      setPlacementsInternal(entry.placements);
      setHiddenIds(new Set(data.hiddenChoristIds || []));
      setRowSizes(entry.rowSizes);
      setFormationName(entry.name);
    }
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

  async function handleDeleteOrUnlinkFormation() {
    if (!activeFormationId) return;
    const formation = formations.find((f) => f.id === activeFormationId);
    const name = formation?.name ?? "";
    // Check how many songs reference this formation
    const songsUsingFormation = Array.from(allSongFormationIds.entries()).filter(
      ([, ids]) => ids.includes(activeFormationId),
    );
    const isShared = songsUsingFormation.length > 1;

    if (isShared) {
      if (!window.confirm(t("formations.confirmUnlink").replace("{name}", name).replace("{count}", String(songsUsingFormation.length - 1)))) return;
      if (activeConcertSongId) {
        const updatedIds = Array.from(songFormationIds).filter((id) => id !== activeFormationId);
        await setSongFormations(activeConcertSongId, updatedIds);
        updateSongFormationIds(new Set(updatedIds));
      }
    } else {
      if (!window.confirm(t("formations.confirmDelete").replace("{name}", name))) return;
      if (!(await deleteFormation(activeFormationId))) return;
      setFormations(formations.filter((f) => f.id !== activeFormationId));
      if (activeConcertSongId) {
        const updatedIds = Array.from(songFormationIds).filter((id) => id !== activeFormationId);
        updateSongFormationIds(new Set(updatedIds));
      }
    }

    setActiveFormationId(null);
    setFormationName(null);
    isSyncingRef.current = true;
    setPastPlacements([]);
    setFuturePlacements([]);
    setPlacementsInternal([]);
    setRowSizes([]);
  }

  function handlePlace(choristId: string) {
    const occupied = new Set(placements.map((p) => `${p.gridX},${p.gridY}`));
    if (rowSizes.length > 0) {
      // Arc mode: only valid arc spots
      for (let gridY = 0; gridY < rowSizes.length; gridY++) {
        for (let gridX = 0; gridX < rowSizes[gridY]; gridX++) {
          if (!occupied.has(`${gridX},${gridY}`)) {
            setPlacements([...placements, { choristId, gridX, gridY }]);
            return;
          }
        }
      }
    } else {
      // Rectangular grid
      for (let gridY = 1; gridY < HEIGHT / CELL_SIZE; gridY++) {
        for (let gridX = 1; gridX < WIDTH / CELL_SIZE; gridX++) {
          if (!occupied.has(`${gridX},${gridY}`)) {
            setPlacements([...placements, { choristId, gridX, gridY }]);
            return;
          }
        }
      }
    }
    // No empty spot — chorist stays unplaced
  }

  function handleRemove(choristId: string) {
    setPlacements(placements.filter((p) => p.choristId !== choristId));
  }

  function handleLoad(
    loaded: { choristId: string; gridX: number; gridY: number }[],
    hidden: string[],
    loadedRowSizes: number[],
  ) {
    isSyncingRef.current = true;
    const normalized = loaded.map((p) => ({
      choristId: p.choristId, gridX: p.gridX, gridY: p.gridY,
    }));
    setPastPlacements([]);
    setFuturePlacements([]);
    setPlacementsInternal(normalized);
    setHiddenIds(new Set(hidden));
    setRowSizes(loadedRowSizes);
    if (activeFormationId) {
      formationCacheRef.current.set(activeFormationId, {
        placements: normalized,
        rowSizes: loadedRowSizes,
        name: formationName ?? "",
      });
    }
  }

  // Build a flat list of navigation stops: each formation is a stop,
  // and songs without formations are also stops.
  function getNavStops(): { songId: string; formationId: string | null }[] {
    const list: { songId: string; formationId: string | null }[] = [];
    for (const song of concertSongs) {
      const songFormations = getFormationsForSong(song.id);
      if (songFormations.length === 0) {
        list.push({ songId: song.id, formationId: null });
      } else {
        for (const f of songFormations) {
          list.push({ songId: song.id, formationId: f.id });
        }
      }
    }
    return list;
  }

  const navStops = getNavStops();
  const activeNavIdx = navStops.findIndex((stop) =>
    stop.songId === activeConcertSongId &&
    stop.formationId === activeFormationId,
  );
  const hasPrevFormation = activeNavIdx > 0;
  const hasNextFormation = activeNavIdx >= 0 && activeNavIdx < navStops.length - 1;

  // Navigate to a nav stop without the auto-load behavior of handleSelectConcertSong
  async function navigateToStop(stop: { songId: string; formationId: string | null }) {
    if (stop.songId !== activeConcertSongId) {
      setActiveConcertSongId(stop.songId);
      const formationIds = await listSongFormations(stop.songId);
      setSongFormationIds(new Set(formationIds));
    }
    if (stop.formationId) {
      await handleSelectFormation(stop.formationId);
    } else {
      // Song with no formations — clear the grid
      await flushPendingSave();
      setActiveFormationId(null);
      setPlacements([]);
      setRowSizes([]);
      setFormationName(null);
    }
  }

  async function handlePrevFormation() {
    if (!hasPrevFormation) return;
    await navigateToStop(navStops[activeNavIdx - 1]);
  }

  async function handleNextFormation() {
    if (!hasNextFormation) return;
    await navigateToStop(navStops[activeNavIdx + 1]);
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
    concertName,
    autoSaveStatus,
    chorists,
    sortedChorists,
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
    showEditSetlist,
    songFormationIds,
    rowSizes,
    activeFormationId,
    formations,
    getFormationsForSong,
    placedIds,
    allChorists: chorists,
    rosterChorists,

    // Undo/redo
    canUndo: pastPlacements.length > 0,
    canRedo: futurePlacements.length > 0,
    undo,
    redo,

    // Setters the UI needs directly
    setPlacements,
    setSelectedIds,
    setShowSetlist,
    setShowChorists,
    setShowFormations,
    setShowRosterModal,
    setShowEditSetlist,
    setConcertSongs,
    updateSongFormationIds,
    setRowSizes,
    setActiveFormationId,
    setVoiceGroups,
    setFormations,

    // Handlers
    handleSelectGroup,
    handleSelectConcertSong,
    handleSelectFormation,
    handleToggleHidden,
    handleSaveRoster,
    handlePlace,
    handleRemove,
    handleLoad,
    handleClampPlacements,
    handleReorderFormations,
    handleDeleteOrUnlinkFormation,
    setFormationName,
    setHighlightPartId,
    hasPrevFormation,
    hasNextFormation,
    handlePrevFormation,
    handleNextFormation,
  };
}
