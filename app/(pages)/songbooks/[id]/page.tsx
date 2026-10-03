"use client";

import { Fragment, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  listSongbooks,
  listSongs,
  listSongbookSongs,
  updateSong,
  deleteSong,
  removeSongFromSongbook,
  type Song,
  type Songbook,
  type SongbookSong,
} from "../../../lib/api";
import {
  Table,
  Thead,
  TheadRow,
  Th,
  Tbody,
  Tr,
  Td,
} from "../../../components/StyledTable";
import NavSidebar from "../../../components/NavSidebar";
import SongModal from "../../../components/songs/SongModal";
import EditSongbookModal from "../../../components/songbooks/EditSongbookModal";
import { ALL_COLUMNS, FILTER_COLUMNS, type ActiveFilter, type YearRange } from "../../../hooks/useSongs";
import { extractSuggestions } from "../../../components/songs/SongFormFields";
import { useTableSort } from "../../../lib/useTableSort";
import { useTranslation } from "../../../lib/LanguageContext";
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, Columns3, Download, EllipsisVertical, Trash, X } from "lucide-react";

const DEFAULT_VISIBLE = ["name", "composer", "arranger", "year", "collectionName"];
const STORAGE_KEY = "songbook-songs-visible-columns";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type DeleteDialogProps = {
  songName: string;
  onRemove: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

function DeleteSongDialog({ songName, onRemove, onDelete, onCancel }: DeleteDialogProps) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 bg-overlay z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-xl shadow-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-4">{songName}</h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={onRemove}
            className="px-4 py-2 border border-border rounded text-sm hover:bg-hover-bg text-left"
          >
            {t("songbooks.removeFromSongbook")}
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 btn-danger text-sm text-left"
          >
            {t("songbooks.deleteFromCatalog")}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded text-sm hover:bg-hover-bg text-left"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SongbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();

  const [songbook, setSongbook] = useState<Songbook | null>(null);
  const [sbSongs, setSbSongs] = useState<SongbookSong[]>([]);
  const [catalogSongs, setCatalogSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE);
  const didRestoreColumns = useRef(false);
  useEffect(() => {
    if (didRestoreColumns.current) return;
    didRestoreColumns.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.includes("name")) {
          setVisibleColumns(parsed);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [yearRange, setYearRange] = useState<YearRange>({ from: null, to: null });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterExpandedCol, setFilterExpandedCol] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [editingModalOpen, setEditingModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<SongbookSong | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<SongbookSong | null>(null);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);

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

  useEffect(() => {
    Promise.all([listSongbooks(), listSongbookSongs(id), listSongs()])
      .then(([books, songs, catalog]) => {
        setSongbook(books.find((b) => b.id === id) ?? null);
        setSbSongs(songs);
        setCatalogSongs(catalog);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const defaultSort = useCallback(
    (a: SongbookSong, b: SongbookSong) => a.sortOrder - b.sortOrder,
    [],
  );

  const filterOptions = useMemo(() => {
    const opts: Record<string, string[]> = {};
    for (const fc of FILTER_COLUMNS) {
      if (fc.type === "bool") {
        opts[fc.key] = ["Yes", "No"];
      } else {
        const values = new Set<string>();
        for (const s of sbSongs) {
          const v = s[fc.key as keyof Song];
          if (v == null || v === "") continue;
          if (fc.key === "languages") {
            String(v).split(",").forEach((l) => { const trimmed = l.trim(); if (trimmed) values.add(trimmed); });
          } else {
            values.add(String(v));
          }
        }
        opts[fc.key] = [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      }
    }
    return opts;
  }, [sbSongs]);

  function isFilterActive(column: string, value: string) {
    return filters.some((f) => f.column === column && f.value === value);
  }

  function toggleFilter(fc: typeof FILTER_COLUMNS[number], value: string) {
    if (isFilterActive(fc.key, value)) {
      setFilters(filters.filter((f) => !(f.column === fc.key && f.value === value)));
    } else {
      setFilters([...filters, { column: fc.key, columnLabel: t(fc.labelKey), value }]);
    }
  }

  function removeFilter(column: string, value: string) {
    setFilters(filters.filter((f) => !(f.column === column && f.value === value)));
  }

  function clearFilters() {
    setFilters([]);
    setYearRange({ from: null, to: null });
  }

  const matchesFilters = useCallback((song: SongbookSong): boolean => {
    if (yearRange.from != null || yearRange.to != null) {
      const y = song.year;
      if (y == null) return false;
      if (yearRange.from != null && y < yearRange.from) return false;
      if (yearRange.to != null && y > yearRange.to) return false;
    }
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
  }, [filters, yearRange]);

  const searched = useMemo(() => {
    const q = search.toLowerCase();
    return sbSongs
      .filter(matchesFilters)
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          (s.composer ?? "").toLowerCase().includes(q) ||
          (s.arranger ?? "").toLowerCase().includes(q) ||
          (s.collectionName ?? "").toLowerCase().includes(q)
        );
      });
  }, [sbSongs, search, matchesFilters]);

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

  function handleDownloadCsv() {
    const header = columns.map((c) => t(c.labelKey)).join(",");
    const rows = filtered.map((s) =>
      columns
        .map((c) => {
          const val = c.render ? c.render(s, t) : (s[c.key] ?? "");
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
    a.download = `${songbook?.name ?? "songbook"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRemoveFromSongbook(song: SongbookSong) {
    await removeSongFromSongbook(id, song.id);
    setSbSongs((prev) => prev.filter((s) => s.id !== song.id));
    setDeletingTarget(null);
  }

  async function handleDeleteFromCatalog(song: SongbookSong) {
    await deleteSong(song.id);
    setSbSongs((prev) => prev.filter((s) => s.id !== song.id));
    setCatalogSongs((prev) => prev.filter((s) => s.id !== song.id));
    setDeletingTarget(null);
  }

  async function handleSaveSong(updated: Song) {
    const { id: songId, ...fields } = updated;
    if (await updateSong(songId, fields)) {
      setSbSongs((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, ...updated } : s)),
      );
      setCatalogSongs((prev) =>
        prev.map((s) => (s.id === songId ? updated : s)),
      );
    }
  }

  const suggestions = extractSuggestions(catalogSongs);
  const expandableColumns = columns.filter((c) => c.key !== "name" && c.key !== "composer");

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-8 min-w-0">
        <div className="mx-auto w-full max-w-6xl">
          <Link
            href="/songbooks"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4"
          >
            <ArrowLeft size={14} />
            {t("songbooks.backToSongbooks")}
          </Link>

          <div className="mb-6 text-center">
            <h1 className="text-4xl font-bold">{songbook?.name ?? "…"}</h1>
            {songbook?.date && (
              <p className="text-sm text-muted mt-1">{formatDate(songbook.date)}</p>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="border border-border rounded px-3 py-1.5 text-sm w-full sm:w-64"
            />
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setFilterMenuOpen(!filterMenuOpen); setFilterExpandedCol(null); }}
                className="px-2 py-1.5 border border-border rounded text-sm hover:bg-hover-bg"
                title={t("common.filter")}
              >
                <EllipsisVertical size={16} />
              </button>
              {filterMenuOpen && (
                <div className="absolute left-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 w-56">
                  {FILTER_COLUMNS.map((fc) => {
                    const options = filterOptions[fc.key] || [];
                    if (fc.type !== "range" && options.length === 0) return null;
                    return (
                      <div key={fc.key}>
                        <button
                          onClick={() => setFilterExpandedCol(filterExpandedCol === fc.key ? null : fc.key)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-hover-bg flex items-center justify-between"
                        >
                          <span>{t(fc.labelKey)}</span>
                          <span className="text-subtle text-xs">
                            {filterExpandedCol === fc.key ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </span>
                        </button>
                        {filterExpandedCol === fc.key && (
                          fc.type === "range" ? (
                            <div className="px-3 pb-2 flex items-center gap-2">
                              <input
                                type="number"
                                placeholder={t("songs.yearFrom")}
                                value={yearRange.from ?? ""}
                                onChange={(e) => setYearRange((r) => ({ ...r, from: e.target.value ? parseInt(e.target.value) : null }))}
                                className="w-20 border border-border rounded px-2 py-1 text-sm"
                              />
                              <span className="text-subtle text-sm">–</span>
                              <input
                                type="number"
                                placeholder={t("songs.yearTo")}
                                value={yearRange.to ?? ""}
                                onChange={(e) => setYearRange((r) => ({ ...r, to: e.target.value ? parseInt(e.target.value) : null }))}
                                className="w-20 border border-border rounded px-2 py-1 text-sm"
                              />
                            </div>
                          ) : (
                            <div className="pl-3 pb-1 max-h-48 overflow-y-auto">
                              {options.map((val) => (
                                <label key={val} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-hover-bg cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isFilterActive(fc.key, val)}
                                    onChange={() => toggleFilter(fc, val)}
                                  />
                                  {fc.type === "bool" ? (val === "Yes" ? t("common.yes") : t("common.no")) : val}
                                </label>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={() => setEditingModalOpen(true)}
              className="px-3 py-1.5 btn-primary text-sm font-medium"
            >
              {t("songbooks.editSongbook")}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleDownloadCsv}
                className="px-2 py-1.5 border border-border rounded text-sm hover:bg-hover-bg"
                title={t("common.downloadCsv")}
              >
                <Download size={16} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setColumnPickerOpen(!columnPickerOpen)}
                  className="px-2 py-1.5 border border-border rounded text-sm hover:bg-hover-bg"
                  title={t("common.columnVisibility")}
                >
                  <Columns3 size={16} />
                </button>
                {columnPickerOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 w-48 py-1">
                    {ALL_COLUMNS.filter((c) => c.key !== "name").map((c) => (
                      <label
                        key={c.key}
                        className="flex items-center gap-2 px-3 py-1 text-sm hover:bg-hover-bg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(c.key)}
                          onChange={() => toggleColumn(c.key)}
                        />
                        {t(c.labelKey)}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter tags */}
          {(filters.length > 0 || yearRange.from != null || yearRange.to != null) && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {yearRange.from != null || yearRange.to != null ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-light text-primary-light-text rounded text-xs">
                  {t("songs.year")}: {yearRange.from ?? "…"}–{yearRange.to ?? "…"}
                  <button onClick={() => setYearRange({ from: null, to: null })} className="hover:text-link">
                    <X size={12} />
                  </button>
                </span>
              ) : null}
              {filters.map((f) => (
                <span key={`${f.column}-${f.value}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-light text-primary-light-text rounded text-xs">
                  {f.columnLabel}: {f.value}
                  <button onClick={() => removeFilter(f.column, f.value)} className="hover:text-link">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button onClick={clearFilters} className="text-xs text-muted hover:text-foreground">
                {t("common.clearAll")}
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <TheadRow>
                  {columns.map((c) => (
                    <Th
                      key={c.key}
                      className={c.key !== "name" && c.key !== "composer" ? "hidden sm:table-cell" : ""}
                      style={
                        c.key === "name"
                          ? { minWidth: "250px" }
                          : { width: c.width, minWidth: c.width }
                      }
                      sortDir={sortKey === c.key ? sortDir : null}
                      onSort={() => cycleSort(c.key as keyof SongbookSong)}
                    >
                      {t(c.labelKey)}
                    </Th>
                  ))}
                  <Th compact className="hidden sm:table-cell" />
                </TheadRow>
              </Thead>
              <Tbody>
                {filtered.map((s) => (
                  <Fragment key={s.id}>
                    <Tr
                      className="cursor-pointer"
                      onClick={() => {
                        if (window.innerWidth >= 640) {
                          setEditingSong(s);
                        } else {
                          setExpandedSongId(expandedSongId === s.id ? null : s.id);
                        }
                      }}
                    >
                      {columns.map((c) => (
                        <Td
                          key={c.key}
                          className={c.key !== "name" && c.key !== "composer" ? "hidden sm:table-cell" : ""}
                        >
                          {c.key === "name" ? (
                            <>
                              <div className="flex items-center justify-between gap-2 sm:hidden">
                                <div className="flex items-center gap-1 min-w-0">
                                  {expandedSongId === s.id
                                    ? <ChevronDown size={14} className="shrink-0 text-muted" />
                                    : <ChevronRight size={14} className="shrink-0 text-muted" />}
                                  <span className="truncate">{s.name}</span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingSong(s); }}
                                  className="shrink-0 text-muted hover:text-foreground"
                                  title={t("songs.openSong")}
                                >
                                  <BookOpen size={16} />
                                </button>
                              </div>
                              <span className="hidden sm:inline">{s.name}</span>
                            </>
                          ) : (
                            c.render
                              ? c.render(s, t)
                              : ((s[c.key as keyof Song] as string | number | null) ?? "")
                          )}
                        </Td>
                      ))}
                      <Td compact className="hidden sm:table-cell">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingTarget(s); }}
                          className="text-danger hover:text-danger-hover text-xs"
                        >
                          {t("common.delete")}
                        </button>
                      </Td>
                    </Tr>
                    {expandedSongId === s.id && (
                      <tr className="border-b border-border bg-surface-alt sm:hidden">
                        <td colSpan={columns.length + 1} className="px-4 py-3">
                          {expandableColumns.length > 0 && (
                            <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm mb-3">
                              {expandableColumns.map((c) => {
                                const val = c.render ? c.render(s, t) : String(s[c.key as keyof Song] ?? "");
                                return (
                                  <div key={c.key}>
                                    <div className="text-xs text-muted">{t(c.labelKey)}</div>
                                    <div>{val || "—"}</div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="flex justify-end">
                            <button
                              onClick={() => setDeletingTarget(s)}
                              className="p-2 btn-danger rounded"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </Tbody>
            </Table>
            {!loading && filtered.length === 0 && (
              <p className="text-subtle text-sm text-center mt-8">
                {sbSongs.length === 0 ? t("songbooks.noSongs") : t("songs.noMatch")}
              </p>
            )}
          </div>
        </div>
      </div>

      {editingModalOpen && (
        <EditSongbookModal
          songbookId={id}
          catalogSongs={catalogSongs}
          songbookSongs={sbSongs}
          onSongsChange={(updated) => {
            setSbSongs(updated);
            // Refresh catalog to include any newly created songs
            listSongs().then(setCatalogSongs);
          }}
          onClose={() => setEditingModalOpen(false)}
        />
      )}

      {editingSong && (
        <SongModal
          song={editingSong}
          onClose={() => setEditingSong(null)}
          onSave={handleSaveSong}
          suggestions={suggestions}
        />
      )}

      {deletingTarget && (
        <DeleteSongDialog
          songName={deletingTarget.name}
          onRemove={() => handleRemoveFromSongbook(deletingTarget)}
          onDelete={() => handleDeleteFromCatalog(deletingTarget)}
          onCancel={() => setDeletingTarget(null)}
        />
      )}
    </div>
  );
}