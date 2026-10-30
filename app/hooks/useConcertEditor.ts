import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../lib/LanguageContext";
import {
  getHiddenChorists,
  listConcertChorists,
  listConcertSongs,
  listFormations,
  listSongFormations,
  listSongs,
  loadFormation,
  saveHiddenChorists,
  setConcertChorists,
  setSongFormations,
  deleteFormation,
  listConcerts,
} from "../lib/api";
import { CELL_SIZE, GRID_WIDTH, GRID_HEIGHT } from "../lib/editorTypes";
import type { Placement } from "../lib/editorTypes";
import { usePlacementHistory } from "./usePlacementHistory";
import { useEditorData } from "./useEditorData";

type Formation = { id: string; name: string; sortOrder: number };
type CachedFormation = { placements: Placement[]; rowSizes: number[]; name: string };

export function useConcertEditor(concertId: string) {
  const { t } = useTranslation();

  const [concertName, setConcertName] = useState<string>("");
  const [notFound, setNotFound] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formationName, setFormationName] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showSetlist, setShowSetlist] = useState(false);
  const [showChorists, setShowChorists] = useState(false);
  const [showFormations, setShowFormations] = useState(false);
  const [showVoiceGroups, setShowVoiceGroups] = useState(false);
  const [concertSongs, setConcertSongs] = useState<
    { id: string; songId: string; name: string; sortOrder: number }[]
  >([]);
  const [activeConcertSongId, setActiveConcertSongId] = useState<string | null>(null);
  const [catalogSongs, setCatalogSongs] = useState<
    { id: string; name: string; composer: string | null }[]
  >([]);
  const [rosterIds, setRosterIds] = useState<Set<string>>(new Set());
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showEditSetlist, setShowEditSetlist] = useState(false);
  const [songFormationIds, setSongFormationIds] = useState<Set<string>>(new Set());
  const [allSongFormationIds, setAllSongFormationIds] = useState<Map<string, string[]>>(new Map());
  const [rowSizes, setRowSizes] = useState<number[]>([]);
  const [activeFormationId, setActiveFormationId] = useState<string | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);

  const formationCacheRef = useRef<Map<string, CachedFormation>>(new Map());
  const latestRowSizesRef = useRef(rowSizes);
  const latestFormationNameRef = useRef(formationName);
  const latestActiveConcertSongIdRef = useRef(activeConcertSongId);
  const latestSongFormationIdsRef = useRef(songFormationIds);
  useEffect(() => { latestRowSizesRef.current = rowSizes; }, [rowSizes]);
  useEffect(() => { latestFormationNameRef.current = formationName; }, [formationName]);
  useEffect(() => { latestActiveConcertSongIdRef.current = activeConcertSongId; }, [activeConcertSongId]);
  useEffect(() => { latestSongFormationIdsRef.current = songFormationIds; }, [songFormationIds]);

  const data = useEditorData();

  const history = usePlacementHistory({
    formationId: activeFormationId,
    onAfterSave: async (placements, fId) => {
      formationCacheRef.current.set(fId, {
        placements,
        rowSizes: latestRowSizesRef.current,
        name: latestFormationNameRef.current ?? "",
      });
      const songId = latestActiveConcertSongIdRef.current;
      const fIds = latestSongFormationIdsRef.current;
      if (songId && !fIds.has(fId)) {
        const updatedIds = [...fIds, fId];
        await setSongFormations(songId, updatedIds);
        setSongFormationIds(new Set(updatedIds));
        setAllSongFormationIds((prev) => {
          const next = new Map(prev);
          next.set(songId, updatedIds);
          return next;
        });
      }
    },
  });

  useEffect(() => {
    listConcerts().then((concerts: { id: string; name: string }[]) => {
      const concert = concerts.find((c) => c.id === concertId);
      if (concert) setConcertName(concert.name);
      else setNotFound(true);
    });
  }, [concertId]);

  useEffect(() => {
    listConcertSongs(concertId).then(setConcertSongs);
  }, [concertId]);

  useEffect(() => {
    listSongs().then((songs) =>
      setCatalogSongs([...songs].sort((a, b) => a.name.localeCompare(b.name))),
    );
  }, []);

  useEffect(() => {
    listConcertChorists(concertId).then((ids: string[]) => setRosterIds(new Set(ids)));
  }, [concertId]);

  useEffect(() => {
    listFormations(concertId).then(setFormations);
  }, [concertId]);

  // Preload formation details into cache so navigation is instant
  useEffect(() => {
    formations.forEach((f) => {
      if (formationCacheRef.current.has(f.id)) return;
      loadFormation(f.id).then((d) => {
        if (!d) return;
        formationCacheRef.current.set(f.id, {
          placements: d.placements.map((p: Placement) => ({ choristId: p.choristId, gridX: p.gridX, gridY: p.gridY })),
          rowSizes: JSON.parse(d.rowSizes || "[]"),
          name: d.name,
        });
      });
    });
  }, [formations]);

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
    if (data.voiceGroups.length === 0) return;
    const fourPart = data.voiceGroups.find(
      (g) => g.name.includes("4-part") || g.name.includes("4-stäm"),
    );
    if (fourPart) {
      hasAutoSelectedGroupRef.current = true;
      data.handleSelectGroup(fourPart.id);
    }
  }, [data.voiceGroups]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePlace(choristId: string) {
    const occupied = new Set(history.placements.map((p) => `${p.gridX},${p.gridY}`));
    if (rowSizes.length > 0) {
      for (let gridY = 0; gridY < rowSizes.length; gridY++) {
        for (let gridX = 0; gridX < rowSizes[gridY]; gridX++) {
          if (!occupied.has(`${gridX},${gridY}`)) {
            history.setPlacements([...history.placements, { choristId, gridX, gridY }]);
            return;
          }
        }
      }
    } else {
      for (let gridY = 1; gridY < GRID_HEIGHT / CELL_SIZE; gridY++) {
        for (let gridX = 1; gridX < GRID_WIDTH / CELL_SIZE; gridX++) {
          if (!occupied.has(`${gridX},${gridY}`)) {
            history.setPlacements([...history.placements, { choristId, gridX, gridY }]);
            return;
          }
        }
      }
    }
  }

  function handleRemove(choristId: string) {
    history.setPlacements(history.placements.filter((p) => p.choristId !== choristId));
  }

  function handleLoad(
    loaded: Placement[],
    hidden: string[],
    loadedRowSizes: number[],
  ) {
    const normalized = loaded.map((p) => ({ choristId: p.choristId, gridX: p.gridX, gridY: p.gridY }));
    history.syncPlacements(normalized);
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

  function handleClampPlacements(rowIndex: number, newSize: number) {
    const onRow = history.placements.filter((p) => p.gridY === rowIndex);
    const notOnRow = history.placements.filter((p) => p.gridY !== rowIndex);
    const valid = onRow.filter((p) => p.gridX < newSize);
    const overflow = onRow.filter((p) => p.gridX >= newSize);
    const taken = new Set(valid.map((p) => p.gridX));
    const clamped = overflow.map((p) => {
      for (let x = newSize - 1; x >= 0; x--) {
        if (!taken.has(x)) { taken.add(x); return { ...p, gridX: x }; }
      }
      return p;
    });
    history.setPlacementsRaw([...notOnRow, ...valid, ...clamped]);
  }

  async function handleSelectConcertSong(concertSongId: string) {
    // Save for the current song/formation BEFORE refs update to the new song
    await history.saveImmediately();
    setActiveConcertSongId(concertSongId);
    const hidden = await getHiddenChorists(concertSongId);
    setHiddenIds(new Set(hidden));
    const formationIds = await listSongFormations(concertSongId);
    setSongFormationIds(new Set(formationIds));

    if (formationIds.length > 0) {
      await handleSelectFormation(formationIds[0], true);
    } else {
      history.syncPlacements([]);
      setActiveFormationId(null);
      setRowSizes([]);
      setFormationName(null);
    }
  }

  async function handleSelectFormation(formationId: string, skipInitialSave = false) {
    if (!skipInitialSave) await history.saveImmediately();
    const cached = formationCacheRef.current.get(formationId);
    if (cached) {
      setActiveFormationId(formationId);
      history.syncPlacements(cached.placements);
      setRowSizes(cached.rowSizes);
      setFormationName(cached.name);
      return;
    }
    const d = await loadFormation(formationId);
    if (d) {
      const entry: CachedFormation = {
        placements: d.placements.map((p: Placement) => ({ choristId: p.choristId, gridX: p.gridX, gridY: p.gridY })),
        rowSizes: JSON.parse(d.rowSizes || "[]"),
        name: d.name,
      };
      formationCacheRef.current.set(formationId, entry);
      setActiveFormationId(formationId);
      history.syncPlacements(entry.placements);
      setHiddenIds(new Set(d.hiddenChoristIds || []));
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
    const removedIds = new Set(Array.from(rosterIds).filter((id) => !ids.has(id)));
    await setConcertChorists(concertId, Array.from(ids));
    setRosterIds(ids);
    if (removedIds.size > 0) {
      history.setPlacementsRaw(history.placements.filter((p) => !removedIds.has(p.choristId)));
      history.clearHistory();
      formationCacheRef.current.forEach((cached, fId) => {
        formationCacheRef.current.set(fId, {
          ...cached,
          placements: cached.placements.filter((p) => !removedIds.has(p.choristId)),
        });
      });
    }
  }

  async function handleDeleteOrUnlinkFormation() {
    if (!activeFormationId) return;
    const formation = formations.find((f) => f.id === activeFormationId);
    const name = formation?.name ?? "";
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
    history.syncPlacements([]);
    setRowSizes([]);
  }

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

  async function handleReorderFormations(songId: string, newOrder: string[]) {
    setAllSongFormationIds((prev) => {
      const next = new Map(prev);
      next.set(songId, newOrder);
      return next;
    });
    if (songId === activeConcertSongId) {
      setSongFormationIds(new Set(newOrder));
    }
    await setSongFormations(songId, newOrder);
  }

  function getFormationsForSong(songId: string) {
    const ids = allSongFormationIds.get(songId) || [];
    return ids
      .map((id) => formations.find((f) => f.id === id))
      .filter((f): f is Formation => f != null);
  }

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
  const activeNavIdx = navStops.findIndex(
    (stop) => stop.songId === activeConcertSongId && stop.formationId === activeFormationId,
  );
  const hasPrevFormation = activeNavIdx > 0;
  const hasNextFormation = activeNavIdx >= 0 && activeNavIdx < navStops.length - 1;

  async function navigateToStop(stop: { songId: string; formationId: string | null }) {
    // Save BEFORE changing the active song so onAfterSave sees the old song
    await history.saveImmediately();
    if (stop.songId !== activeConcertSongId) {
      setActiveConcertSongId(stop.songId);
      const formationIds = await listSongFormations(stop.songId);
      setSongFormationIds(new Set(formationIds));
    }
    if (stop.formationId) {
      await handleSelectFormation(stop.formationId, true);
    } else {
      setActiveFormationId(null);
      history.syncPlacements([]);
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

  const placedIds = new Set(history.placements.map((p) => p.choristId));
  const rosterChorists = data.sortedChorists.filter((c) => rosterIds.has(c.id));

  return {
    notFound,

    // From shared data hook
    chorists: data.chorists,
    sortedChorists: data.sortedChorists,
    voiceGroups: data.voiceGroups,
    setVoiceGroups: data.setVoiceGroups,
    activeGroupId: data.activeGroupId,
    assignments: data.assignments,
    highlightPartId: data.highlightPartId,
    setHighlightPartId: data.setHighlightPartId,
    handleSelectGroup: data.handleSelectGroup,

    // From placement history hook
    placements: history.placements,
    setPlacements: history.setPlacements,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    autoSaveStatus: history.autoSaveStatus,

    // Local state
    concertName,
    selectedIds,
    setSelectedIds,
    formationName,
    setFormationName,
    hiddenIds,
    showSetlist,
    setShowSetlist,
    showChorists,
    setShowChorists,
    showFormations,
    setShowFormations,
    showVoiceGroups,
    setShowVoiceGroups,
    concertSongs,
    setConcertSongs,
    activeConcertSongId,
    catalogSongs,
    rosterIds,
    showRosterModal,
    setShowRosterModal,
    showEditSetlist,
    setShowEditSetlist,
    songFormationIds,
    updateSongFormationIds,
    rowSizes,
    setRowSizes,
    activeFormationId,
    setActiveFormationId,
    formations,
    setFormations,
    placedIds,
    allChorists: data.chorists,
    rosterChorists,
    getFormationsForSong,
    hasPrevFormation,
    hasNextFormation,

    // Handlers
    handlePlace,
    handleRemove,
    handleLoad,
    handleClampPlacements,
    handleSelectConcertSong,
    handleSelectFormation,
    handleToggleHidden,
    handleSaveRoster,
    handleDeleteOrUnlinkFormation,
    handleReorderFormations,
    handlePrevFormation,
    handleNextFormation,
  };
}