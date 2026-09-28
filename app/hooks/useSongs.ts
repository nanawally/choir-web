import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  listSongs,
  createSong,
  updateSong,
  deleteSong,
  uploadSheetMusic,
  type Song,
} from "../lib/api";
import { useTableSort } from "../lib/useTableSort";
import { useTranslation } from "../lib/LanguageContext";

type ColumnDef = {
  key: keyof Song;
  label: string;
  render?: (song: Song) => string;
  width?: string;
};

export const ALL_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "composer", label: "Composer", width: "120px" },
  { key: "arranger", label: "Arranger", width: "120px" },
  { key: "delning", label: "Delning", width: "100px" },
  { key: "languages", label: "Languages", width: "120px" },
  { key: "length", label: "Length", width: "80px" },
  {
    key: "accompanied",
    label: "Accompanied",
    width: "130px",
    render: (s) => {
      if (s.accompanied == null) return "";
      if (!s.accompanied) return "No";
      return s.instrument ? `Yes — ${s.instrument}` : "Yes";
    },
  },
  { key: "year", label: "Year", width: "70px" },
  { key: "collectionName", label: "Collection", width: "130px" },
  {
    key: "hasSoloists",
    label: "Soloists",
    width: "120px",
    render: (s) => {
      if (s.hasSoloists == null) return "";
      if (!s.hasSoloists) return "No";
      return s.soloistNames ? `Yes — ${s.soloistNames}` : "Yes";
    },
  },
  {
    key: "hasSheetMusicFile",
    label: "Sheet music",
    width: "100px",
    render: (s) => (s.hasSheetMusicFile ? "Yes" : "No"),
  },
];

const DEFAULT_VISIBLE = ["name", "composer", "arranger", "year", "collectionName"];
const STORAGE_KEY = "songs-visible-columns";

export type ActiveFilter = { column: string; columnLabel: string; value: string };

export const FILTER_COLUMNS: { key: keyof Song; label: string; type: "text" | "bool" }[] = [
  { key: "composer", label: "Composer", type: "text" },
  { key: "arranger", label: "Arranger", type: "text" },
  { key: "delning", label: "Delning", type: "text" },
  { key: "languages", label: "Languages", type: "text" },
  { key: "accompanied", label: "Accompanied", type: "bool" },
  { key: "year", label: "Year", type: "text" },
  { key: "collectionName", label: "Collection", type: "text" },
  { key: "hasSoloists", label: "Soloists", type: "bool" },
  { key: "hasSheetMusicFile", label: "Sheet music", type: "bool" },
];

export function useSongs() {
  const { t } = useTranslation();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterExpandedCol, setFilterExpandedCol] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const defaultSort = useCallback(
    (a: Song, b: Song) => a.name.localeCompare(b.name),
    [],
  );

  useEffect(() => {
    listSongs().then(setSongs).finally(() => setLoading(false));
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.includes("name")) setVisibleColumns(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
        setFilterExpandedCol(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filterOptions = useMemo(() => {
    const opts: Record<string, string[]> = {};
    for (const fc of FILTER_COLUMNS) {
      if (fc.type === "bool") {
        opts[fc.key] = ["Yes", "No"];
      } else {
        const values = new Set<string>();
        for (const s of songs) {
          const v = s[fc.key];
          if (v == null || v === "") continue;
          if (fc.key === "languages") {
            String(v).split(",").forEach((l) => {
              const trimmed = l.trim();
              if (trimmed) values.add(trimmed);
            });
          } else {
            values.add(String(v));
          }
        }
        opts[fc.key] = [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      }
    }
    return opts;
  }, [songs]);

  function isFilterActive(column: string, value: string) {
    return filters.some((f) => f.column === column && f.value === value);
  }

  function toggleFilter(fc: typeof FILTER_COLUMNS[number], value: string) {
    if (isFilterActive(fc.key, value)) {
      setFilters(filters.filter((f) => !(f.column === fc.key && f.value === value)));
    } else {
      setFilters([...filters, { column: fc.key, columnLabel: fc.label, value }]);
    }
  }

  function removeFilter(column: string, value: string) {
    setFilters(filters.filter((f) => !(f.column === column && f.value === value)));
  }

  function clearFilters() {
    setFilters([]);
  }

  function matchesFilters(song: Song): boolean {
    if (filters.length === 0) return true;
    const byColumn = new Map<string, string[]>();
    for (const f of filters) {
      const vals = byColumn.get(f.column) || [];
      vals.push(f.value);
      byColumn.set(f.column, vals);
    }
    for (const [col, vals] of byColumn) {
      const fc = FILTER_COLUMNS.find((c) => c.key === col);
      if (!fc) return false;
      if (fc.type === "bool") {
        const songVal = song[fc.key as keyof Song];
        const display = songVal ? "Yes" : "No";
        if (!vals.includes(display)) return false;
      } else if (fc.key === "languages") {
        const songLangs = String(song.languages ?? "").split(",").map((l) => l.trim()).filter(Boolean);
        if (!vals.some((v) => songLangs.includes(v))) return false;
      } else {
        const songVal = String(song[fc.key as keyof Song] ?? "");
        if (!vals.includes(songVal)) return false;
      }
    }
    return true;
  }

  const searched = useMemo(() => {
    const q = search.toLowerCase();
    return songs
      .filter((s) => matchesFilters(s))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.composer?.toLowerCase().includes(q) ||
          s.arranger?.toLowerCase().includes(q) ||
          s.collectionName?.toLowerCase().includes(q)
        );
      });
  }, [songs, search, filters]);

  const { sorted: filtered, sortKey, sortDir, cycleSort } = useTableSort(searched, defaultSort);

  const columns = ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key));

  function toggleColumn(key: string) {
    setVisibleColumns((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleCreate(fields: Omit<Song, "id" | "hasSheetMusicFile">, file?: File) {
    if (!fields.name.trim()) return;
    const song = await createSong(fields.name.trim());
    if (song) {
      const merged = { ...song, ...fields };
      const { id: _id, ...updateFields } = merged;
      await updateSong(song.id, updateFields);
      if (file) {
        await uploadSheetMusic(song.id, file);
      }
      const refreshed = await listSongs();
      setSongs(refreshed);
      setShowAdd(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("songs.confirmDelete"))) return;
    if (await deleteSong(id)) {
      setSongs(songs.filter((s) => s.id !== id));
    }
  }

  async function handleSave(updated: Song) {
    const { id, ...fields } = updated;
    if (await updateSong(id, fields)) {
      setSongs(songs.map((s) => (s.id === id ? updated : s)));
    }
  }

  function handleDownloadCsv() {
    const header = columns.map((c) => c.label).join(",");
    const rows = filtered.map((s) =>
      columns
        .map((c) => {
          const val = c.render ? c.render(s) : (s[c.key] ?? "");
          const str = String(val);
          return str.includes(",") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "songs.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    songs,
    loading,
    search,
    setSearch,
    visibleColumns,
    columnPickerOpen,
    setColumnPickerOpen,
    showAdd,
    setShowAdd,
    editingSong,
    setEditingSong,
    filters,
    filterMenuOpen,
    setFilterMenuOpen,
    filterExpandedCol,
    setFilterExpandedCol,
    filterRef,
    filterOptions,
    filtered,
    columns,
    sortKey,
    sortDir,
    cycleSort,
    isFilterActive,
    toggleFilter,
    removeFilter,
    clearFilters,
    toggleColumn,
    handleCreate,
    handleDelete,
    handleSave,
    handleDownloadCsv,
  };
}
