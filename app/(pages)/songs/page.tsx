"use client";

import { useState, Fragment } from "react";
import { type Song } from "../../lib/api";
import SongModal from "../../components/songs/SongModal";
import {
  Table,
  Thead,
  TheadRow,
  Th,
  Tbody,
  Tr,
  Td,
} from "../../components/StyledTable";
import NavSidebar from "../../components/NavSidebar";
import AddSongModal from "../../components/songs/AddSongModal";
import { extractSuggestions } from "../../components/songs/SongFormFields";
import { useSongs, ALL_COLUMNS, FILTER_COLUMNS } from "../../hooks/useSongs";
import {
  EllipsisVertical,
  ChevronDown,
  ChevronRight,
  Download,
  X,
  Columns3,
  BookOpen,
  Trash,
} from "lucide-react";
import { useTranslation } from "../../lib/LanguageContext";

export default function SongsPage() {
  const {
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
    yearRange,
    setYearRange,
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
  } = useSongs();

  const { t } = useTranslation();
  const suggestions = extractSuggestions(songs);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  const expandableColumns = columns.filter((c) => c.key !== "name" && c.key !== "composer");

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6 text-center">
          {t("songs.title")}
        </h1>

        {/* Toolbar */}
        <div className="mx-auto w-full max-w-6xl flex flex-wrap items-center gap-3 mb-4">
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
                        onClick={() =>
                          setFilterExpandedCol(
                            filterExpandedCol === fc.key ? null : fc.key,
                          )
                        }
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
                                  from: e.target.value
                                    ? parseInt(e.target.value)
                                    : null,
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
                                  to: e.target.value
                                    ? parseInt(e.target.value)
                                    : null,
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
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 btn-primary text-sm font-medium"
          >
            {t("songs.addSong")}
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
        {(filters.length > 0 ||
          yearRange.from != null ||
          yearRange.to != null) && (
          <div className="mx-auto w-full max-w-6xl flex items-center gap-2 mb-3 flex-wrap">
            {yearRange.from != null || yearRange.to != null ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-light text-primary-light-text rounded text-xs">
                {t("songs.year")}: {yearRange.from ?? "…"}–{yearRange.to ?? "…"}
                <button
                  onClick={() => setYearRange({ from: null, to: null })}
                  className="hover:text-link"
                >
                  <X size={12} />
                </button>
              </span>
            ) : null}
            {filters.map((f) => (
              <span
                key={`${f.column}-${f.value}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-light text-primary-light-text rounded text-xs"
              >
                {f.columnLabel}: {f.value}
                <button
                  onClick={() => removeFilter(f.column, f.value)}
                  className="hover:text-link"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-muted hover:text-foreground"
            >
              {t("common.clearAll")}
            </button>
          </div>
        )}

        {showAdd && (
          <AddSongModal
            onClose={() => setShowAdd(false)}
            onCreate={handleCreate}
            suggestions={suggestions}
          />
        )}

        {/* Table */}
        <div className="mx-auto w-full max-w-6xl overflow-x-auto">
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
                    onSort={() => cycleSort(c.key)}
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
                            : ((s[c.key] as string | number | null) ?? "")
                        )}
                      </Td>
                    ))}
                    <Td compact className="hidden sm:table-cell">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(s.id);
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
                              const val = c.render ? c.render(s, t) : String(s[c.key] ?? "");
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
                            onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
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
              {songs.length === 0 ? t("songs.noSongs") : t("songs.noMatch")}
            </p>
          )}
        </div>

        {/* Edit modal */}
        {editingSong && (
          <SongModal
            song={editingSong}
            onClose={() => setEditingSong(null)}
            onSave={handleSave}
            suggestions={suggestions}
          />
        )}
      </div>
    </div>
  );
}

