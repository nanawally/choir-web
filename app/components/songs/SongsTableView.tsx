"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Song } from "../../lib/api";
import { ALL_COLUMNS, FILTER_COLUMNS, type ActiveFilter, type YearRange } from "../../hooks/useSongs";
import { useTableSort } from "../../lib/useTableSort";
import { useTranslation } from "../../lib/LanguageContext";
import { Table, Thead, TheadRow, Th, Tbody, Tr, Td } from "../StyledTable";
import {
  ChevronDown,
  ChevronRight,
  Columns3,
  Download,
  FolderOpen,
  Trash,
  X,
} from "lucide-react";

type Props<T extends Song> = {
  songs: T[];
  loading: boolean;
  storageKey: string;
  defaultSort: (a: T, b: T) => number;
  csvFilename: string;
  toolbarAction?: ReactNode;
  onRowClick: (song: T) => void;
  onDelete: (song: T) => void;
  noItemsMessage?: string;
  noMatchMessage?: string;
  className?: string;
};

export function SongsTableView<T extends Song>({
  songs,
  loading,
  storageKey,
  defaultSort,
  csvFilename,
  toolbarAction,
  onRowClick,
  onDelete,
  noItemsMessage,
  noMatchMessage,
  className,
}: Props<T>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name", "composer", "arranger", "year", "collectionName",
  ]);
  const didRestoreColumns = useRef(false);
  useEffect(() => {
    if (didRestoreColumns.current) return;
    didRestoreColumns.current = true;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.includes("name")) {
          setVisibleColumns(parsed);
        }
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [yearRange, setYearRange] = useState<YearRange>({ from: null, to: null });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterExpandedCol, setFilterExpandedCol] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
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

  const filterOptions = useMemo(() => {
    const opts: Record<string, string[]> = {};
    for (const fc of FILTER_COLUMNS) {
      if (fc.type === "bool") {
        opts[fc.key] = ["Yes", "No"];
      } else {
        const values = new Set<string>();
        for (const s of songs) {
          const v = s[fc.key as keyof Song];
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

  function toggleFilter(fc: (typeof FILTER_COLUMNS)[number], value: string) {
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

  const matchesFilters = useCallback(
    (song: T): boolean => {
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
    },
    [filters, yearRange],
  );

  const searched = useMemo(() => {
    const q = search.toLowerCase();
    return songs.filter(matchesFilters).filter((s) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.composer ?? "").toLowerCase().includes(q) ||
        (s.arranger ?? "").toLowerCase().includes(q) ||
        (s.collectionName ?? "").toLowerCase().includes(q)
      );
    });
  }, [songs, search, matchesFilters]);

  const { sorted: filtered, sortKey, sortDir, cycleSort } = useTableSort(searched, defaultSort);
  const columns = ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key));
  const expandableColumns = columns.filter((c) => c.key !== "name" && c.key !== "composer");

  function toggleColumn(key: string) {
    setVisibleColumns((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function handleDownloadCsv() {
    const header = columns.map((c) => t(c.labelKey)).join(",");
    const rows = filtered.map((s) =>
      columns.map((c) => {
        const val = c.render ? c.render(s, t) : (s[c.key] ?? "");
        const str = String(val);
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFilename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`flex-1 min-h-0 flex flex-col overflow-hidden${className ? ` ${className}` : ""}`}>
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
            onClick={() => {
              setFilterMenuOpen(!filterMenuOpen);
              setFilterExpandedCol(null);
            }}
            className="px-2 py-1.5 border border-border rounded text-sm hover:bg-hover-bg"
            title={t("common.filter")}
          >
            {t("common.filter")}
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
                        {filterExpandedCol === fc.key ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                      </span>
                    </button>
                    {filterExpandedCol === fc.key &&
                      (fc.type === "range" ? (
                        <div className="px-3 pb-2 flex items-center gap-2">
                          <input
                            type="number"
                            placeholder={t("songs.yearFrom")}
                            value={yearRange.from ?? ""}
                            onChange={(e) =>
                              setYearRange((r) => ({
                                ...r,
                                from: e.target.value ? parseInt(e.target.value) : null,
                              }))
                            }
                            className="w-20 border border-border rounded px-2 py-1 text-sm"
                          />
                          <span className="text-subtle text-sm">–</span>
                          <input
                            type="number"
                            placeholder={t("songs.yearTo")}
                            value={yearRange.to ?? ""}
                            onChange={(e) =>
                              setYearRange((r) => ({
                                ...r,
                                to: e.target.value ? parseInt(e.target.value) : null,
                              }))
                            }
                            className="w-20 border border-border rounded px-2 py-1 text-sm"
                          />
                        </div>
                      ) : (
                        <div className="pl-3 pb-1 max-h-48 overflow-y-auto">
                          {options.map((val) => (
                            <label
                              key={val}
                              className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-hover-bg cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isFilterActive(fc.key, val)}
                                onChange={() => toggleFilter(fc, val)}
                              />
                              {fc.type === "bool"
                                ? val === "Yes"
                                  ? t("common.yes")
                                  : t("common.no")
                                : val}
                            </label>
                          ))}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {toolbarAction}
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
                    className={`flex items-center gap-2 px-3 py-1 text-sm hover:bg-hover-bg cursor-pointer${c.key === "composer" ? " hidden sm:flex" : ""}`}
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
          {(yearRange.from != null || yearRange.to != null) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-light text-primary-light-text rounded text-xs">
              {t("songs.year")}: {yearRange.from ?? "…"}–{yearRange.to ?? "…"}
              <button onClick={() => setYearRange({ from: null, to: null })} className="hover:text-link">
                <X size={12} />
              </button>
            </span>
          )}
          {filters.map((f) => (
            <span
              key={`${f.column}-${f.value}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-light text-primary-light-text rounded text-xs"
            >
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
      <div className="flex-1 min-h-0 overflow-auto">
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
                  onSort={() => cycleSort(c.key as keyof T)}
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
                      onRowClick(s);
                    } else {
                      setExpandedSongId(expandedSongId === s.id ? null : s.id);
                    }
                  }}
                >
                  {columns.map((c) => {
                    const cellText =
                      c.key !== "name"
                        ? String(c.render ? c.render(s, t) : (s[c.key] ?? ""))
                        : "";
                    return (
                      <Td
                        key={c.key}
                        className={
                          c.key !== "name" && c.key !== "composer"
                            ? "hidden sm:table-cell"
                            : ""
                        }
                      >
                        {c.key === "name" ? (
                          <>
                            <div className="flex items-center justify-between gap-2 sm:hidden">
                              <div className="flex items-center gap-1 min-w-0">
                                {expandedSongId === s.id ? (
                                  <ChevronDown size={14} className="shrink-0 text-muted" />
                                ) : (
                                  <ChevronRight size={14} className="shrink-0 text-muted" />
                                )}
                                <span className="truncate">{s.name}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRowClick(s);
                                }}
                                className="shrink-0 text-muted hover:text-foreground"
                                title={t("songs.openSong")}
                              >
                                <FolderOpen size={16} />
                              </button>
                            </div>
                            <span className="hidden sm:inline">{s.name}</span>
                          </>
                        ) : cellText ? (
                          <span
                            className="block truncate"
                            style={{ maxWidth: c.width }}
                            title={cellText}
                          >
                            {cellText}
                          </span>
                        ) : null}
                      </Td>
                    );
                  })}
                  <Td compact className="hidden sm:table-cell">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(s);
                      }}
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
                            const val = c.render
                              ? c.render(s, t)
                              : String(s[c.key] ?? "");
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
                        <button onClick={() => onDelete(s)} className="p-2 btn-danger rounded">
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
            {songs.length === 0 ? noItemsMessage : noMatchMessage}
          </p>
        )}
      </div>
    </div>
  );
}