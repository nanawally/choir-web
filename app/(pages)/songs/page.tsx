"use client";

import { useEffect, useState } from "react";
import {
  type Song,
  getSheetMusicUrl,
  getToken,
} from "../../lib/api";
import SongInfoTab from "../../components/SongInfoTab";
import SongSheetMusicTab from "../../components/SongSheetMusicTab";
import SongLyricsTab from "../../components/SongLyricsTab";
import SongListeningTab from "../../components/SongListeningTab";
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
import AddSongModal from "../../components/AddSongModal";
import { SongFormFields, extractSuggestions } from "../../components/SongFormFields";
import { useSongs, ALL_COLUMNS, FILTER_COLUMNS } from "../../hooks/useSongs";
import {
  EllipsisVertical,
  ChevronDown,
  ChevronRight,
  Download,
  X,
  SquarePen,
  Columns3,
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

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6 text-center">
          {t("songs.title")}
        </h1>

        {/* Toolbar */}
        <div className="mx-auto w-full max-w-6xl flex items-center gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            className="border border-border rounded px-3 py-1.5 text-sm w-64"
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
                <Th compact />
              </TheadRow>
            </Thead>
            <Tbody>
              {filtered.map((s) => (
                <Tr
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => setEditingSong(s)}
                >
                  {columns.map((c) => (
                    <Td key={c.key}>
                      {c.render
                        ? c.render(s, t)
                        : ((s[c.key] as string | number | null) ?? "")}
                    </Td>
                  ))}
                  <Td compact>
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

function SongModal({
  song,
  onClose,
  onSave,
  suggestions,
}: {
  song: Song;
  onClose: () => void;
  onSave: (updated: Song) => void;
  suggestions: ReturnType<typeof extractSuggestions>;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState<Song>({ ...song });
  const [form, setForm] = useState<Song>({ ...song });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "sheet" | "lyrics" | "listening">("info");

  useEffect(() => {
    if (!current.hasSheetMusicFile) return;
    let revoked = false;
    const url = getSheetMusicUrl(current.id);
    const token = getToken();
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob && !revoked) setPdfUrl(URL.createObjectURL(blob));
      });
    return () => {
      revoked = true;
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [current.id, current.hasSheetMusicFile]);

  function handleViewPdf() {
    const url = getSheetMusicUrl(current.id);
    const token = getToken();
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      });
  }

  function set<K extends keyof Song>(key: K, value: Song[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) return;
    onSave(form);
    setCurrent({ ...form });
    setEditing(false);
  }

  function handleCancel() {
    setForm({ ...current });
    setEditing(false);
  }

  function handleSheetMusicChange(hasFile: boolean) {
    setCurrent((c) => ({ ...c, hasSheetMusicFile: hasFile, hasSheetMusic: hasFile || c.hasSheetMusic }));
    setForm((f) => ({ ...f, hasSheetMusicFile: hasFile, hasSheetMusic: hasFile || f.hasSheetMusic }));
  }

  if (editing) {
    return (
      <div
        className="fixed inset-0 bg-overlay flex items-center justify-center z-50 overflow-y-auto p-4"
        onClick={onClose}
      >
        <div
          className="bg-surface rounded-xl shadow-xl w-[calc(100vw-2rem)] max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto p-6 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold mb-4">{t("songs.editSong")}</h2>
          <SongFormFields form={form} set={set} suggestions={suggestions} />

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-1.5 border border-border rounded text-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 btn-primary text-sm"
            >
              {t("common.save")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-overlay flex items-center justify-center z-50 overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl w-[calc(100vw-2rem)] max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">{current.name}</h2>
            {current.composer && (
              <p className="text-sm text-muted">{current.composer}</p>
            )}
          </div>
          <button
            onClick={() => {
              setForm({ ...current });
              setEditing(true);
            }}
            className="text-subtle hover:text-muted"
            title={t("common.edit")}
          >
            <SquarePen size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-4">
          {(["info", "sheet", "lyrics", "listening"] as const).map((t2) => {
            const label =
              t2 === "info" ? t("songs.tabInfo") :
              t2 === "sheet" ? t("songs.sheetMusicTitle") :
              t2 === "lyrics" ? t("songs.lyrics") :
              t("songs.tabListening");
            return (
              <button
                key={t2}
                onClick={() => setTab(t2)}
                className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === t2
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === "info" && (
          <SongInfoTab song={current} pdfUrl={pdfUrl} onViewPdf={handleViewPdf} />
        )}
        {tab === "sheet" && (
          <SongSheetMusicTab
            songId={current.id}
            hasSheetMusicFile={current.hasSheetMusicFile}
            pdfUrl={pdfUrl}
            onViewPdf={handleViewPdf}
            onSheetMusicChange={handleSheetMusicChange}
          />
        )}
        {tab === "lyrics" && <SongLyricsTab lyrics={current.lyrics} />}
        {tab === "listening" && <SongListeningTab songId={current.id} />}
      </div>
    </div>
  );
}
