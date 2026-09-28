"use client";

import { useEffect, useRef, useState } from "react";
import { type Song, listSongConcerts, uploadSheetMusic, getSheetMusicUrl, deleteSheetMusic, getToken } from "../../lib/api";
import dynamic from "next/dynamic";

const PdfPreview = dynamic(() => import("../../components/PdfPreview"), { ssr: false });
import { Table, Thead, TheadRow, Th, Tbody, Tr, Td } from "../../components/StyledTable";
import NavSidebar from "../../components/NavSidebar";
import AddSongModal from "../../components/AddSongModal";
import { SongFormFields } from "../../components/SongFormFields";
import { useSongs, ALL_COLUMNS, FILTER_COLUMNS } from "../../hooks/useSongs";
import { EllipsisVertical, ChevronDown, ChevronRight, Download, X, SquarePen, Columns3, Upload, FileText, Trash2 } from "lucide-react";
import Image from "next/image";
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

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col py-8 px-8">
      <h1 className="text-4xl font-bold mb-6 text-center">{t("songs.title")}</h1>

      {/* Toolbar */}
      <div className="mx-auto w-full max-w-6xl flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64"
        />
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => {
              setFilterMenuOpen(!filterMenuOpen);
              setFilterExpandedCol(null);
            }}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            title={t("common.filter")}
          >
            <EllipsisVertical size={16} />
          </button>
          {filterMenuOpen && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-56">
              {FILTER_COLUMNS.map((fc) => {
                const options = filterOptions[fc.key] || [];
                if (fc.type !== "range" && options.length === 0) return null;
                return (
                  <div key={fc.key}>
                    <button
                      onClick={() =>
                        setFilterExpandedCol(filterExpandedCol === fc.key ? null : fc.key)
                      }
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>{t(fc.labelKey)}</span>
                      <span className="text-gray-400 text-xs">
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
                            onChange={(e) =>
                              setYearRange((r) => ({ ...r, from: e.target.value ? parseInt(e.target.value) : null }))
                            }
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                          <span className="text-gray-400 text-sm">–</span>
                          <input
                            type="number"
                            placeholder={t("songs.yearTo")}
                            value={yearRange.to ?? ""}
                            onChange={(e) =>
                              setYearRange((r) => ({ ...r, to: e.target.value ? parseInt(e.target.value) : null }))
                            }
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                      ) : (
                        <div className="pl-3 pb-1 max-h-48 overflow-y-auto">
                          {options.map((val) => (
                            <label
                              key={val}
                              className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isFilterActive(fc.key, val)}
                                onChange={() => toggleFilter(fc, val)}
                              />
                              {val}
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
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm font-medium"
        >
          {t("songs.addSong")}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            title={t("common.downloadCsv")}
          >
            <Download size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => setColumnPickerOpen(!columnPickerOpen)}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
              title={t("common.columnVisibility")}
            >
              <Columns3 size={16} />
            </button>
            {columnPickerOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48 py-1">
                {ALL_COLUMNS.filter((c) => c.key !== "name").map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 px-3 py-1 text-sm hover:bg-gray-50 cursor-pointer"
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
        <div className="mx-auto w-full max-w-6xl flex items-center gap-2 mb-3 flex-wrap">
          {yearRange.from != null || yearRange.to != null ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
              {t("songs.year")}: {yearRange.from ?? "…"}–{yearRange.to ?? "…"}
              <button
                onClick={() => setYearRange({ from: null, to: null })}
                className="hover:text-blue-600"
              >
                <X size={12} />
              </button>
            </span>
          ) : null}
          {filters.map((f) => (
            <span
              key={`${f.column}-${f.value}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
            >
              {f.columnLabel}: {f.value}
              <button
                onClick={() => removeFilter(f.column, f.value)}
                className="hover:text-blue-600"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {t("common.clearAll")}
          </button>
        </div>
      )}

      {showAdd && (
        <AddSongModal
          onClose={() => setShowAdd(false)}
          onCreate={handleCreate}
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
                  style={c.key === "name" ? { minWidth: "250px" } : { width: c.width, minWidth: c.width }}
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
                    {c.render ? c.render(s, t) : (s[c.key] as string | number | null) ?? ""}
                  </Td>
                ))}
                <Td compact>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s.id);
                    }}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    {t("common.delete")}
                  </button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        {!loading && filtered.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8">
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
        />
      )}
      </div>
    </div>
  );
}

function BooleanDetail({
  label,
  flag,
  details,
}: {
  label: string;
  flag: boolean | null;
  details: string | null;
}) {
  const { t } = useTranslation();
  if (flag == null) return <DetailCell label={label} value="—" />;
  if (!flag) return <DetailCell label={label} value={t("common.no")} />;
  const items = details
    ? details.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return (
    <div>
      <span className="block text-xs text-gray-500 mb-0.5">{label}</span>
      <span className="text-sm">{t("common.yes")}</span>
      {items.length > 0 && (
        <ul className="mt-1 ml-4 list-disc text-sm text-gray-700">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs text-gray-500 mb-0.5">{label}</span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
}

function SongModal({
  song,
  onClose,
  onSave,
}: {
  song: Song;
  onClose: () => void;
  onSave: (updated: Song) => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState<Song>({ ...song });
  const [form, setForm] = useState<Song>({ ...song });
  const [concerts, setConcerts] = useState<{ id: string; name: string }[]>([]);
  const [showAllConcerts, setShowAllConcerts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listSongConcerts(song.id).then(setConcerts);
  }, [song.id]);

  useEffect(() => {
    if (!current.hasSheetMusicFile) return;
    let revoked = false;
    const url = getSheetMusicUrl(current.id);
    const token = getToken();
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.ok ? res.blob() : null)
      .then((blob) => {
        if (blob && !revoked) setPdfUrl(URL.createObjectURL(blob));
      });
    return () => {
      revoked = true;
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [current.id, current.hasSheetMusicFile]);

  async function handleUpload(file: File) {
    setUploading(true);
    const result = await uploadSheetMusic(current.id, file);
    if (result) {
      setCurrent((c) => ({ ...c, hasSheetMusicFile: true, hasSheetMusic: true }));
      setForm((f) => ({ ...f, hasSheetMusicFile: true, hasSheetMusic: true }));
    }
    setUploading(false);
  }

  async function handleDeleteSheetMusic() {
    if (!window.confirm(t("songs.confirmDeleteSheet"))) return;
    if (await deleteSheetMusic(current.id)) {
      setCurrent((c) => ({ ...c, hasSheetMusicFile: false }));
      setForm((f) => ({ ...f, hasSheetMusicFile: false }));
    }
  }

  function handleViewPdf() {
    const url = getSheetMusicUrl(current.id);
    const token = getToken();
    // Open in new tab — need to fetch with auth and open as blob
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

  const visibleConcerts = showAllConcerts ? concerts : concerts.slice(0, 3);

  if (editing) {
    return (
      <div
        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold mb-4">{t("songs.editSong")}</h2>
          <SongFormFields form={form} set={set} />

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={handleCancel} className="px-4 py-1.5 border border-gray-300 rounded text-sm">
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-500 text-white rounded text-sm"
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
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">{current.name}</h2>
            {current.composer && (
              <p className="text-sm text-gray-500">{current.composer}</p>
            )}
          </div>
          <div className="flex items-start gap-2">
            {current.hasSheetMusicFile && (
              <Image
                src="/musical-score-icon.png"
                alt="Sheet music available"
                width={40}
                height={40}
              />
            )}
            <button
              onClick={() => {
                setForm({ ...current });
                setEditing(true);
              }}
              className="text-gray-400 hover:text-gray-600"
              title={t("common.edit")}
            >
              <SquarePen size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-6">
          <DetailCell label={t("songs.arranger")} value={current.arranger ?? "—"} />
          <DetailCell label={t("songs.delning")} value={current.delning ?? "—"} />
          <DetailCell label={t("songs.languages")} value={current.languages ?? "—"} />
          <DetailCell label={t("songs.length")} value={current.length ?? "—"} />
          <DetailCell label={t("songs.year")} value={current.year?.toString() ?? "—"} />
          <DetailCell label={t("songs.sheetMusic")} value={current.hasSheetMusicFile ? t("common.yes") : t("common.no")} />
          <DetailCell label={t("songs.collection")} value={current.collectionName ?? "—"} />
          <BooleanDetail
            label={t("songs.accompanied")}
            flag={current.accompanied}
            details={current.instrument}
          />
          <BooleanDetail
            label={t("songs.soloists")}
            flag={current.hasSoloists}
            details={current.soloistNames}
          />
          {concerts.length > 0 && (
            <div>
              <span className="block text-xs text-gray-500 mb-0.5">{t("songs.usedIn")}</span>
              <ul className="text-sm text-gray-700 space-y-0.5">
                {visibleConcerts.map((c) => (
                  <li key={c.id}>{c.name}</li>
                ))}
              </ul>
              {concerts.length > 3 && (
                <button
                  onClick={() => setShowAllConcerts(!showAllConcerts)}
                  className="text-xs text-blue-500 hover:underline mt-1"
                >
                  {showAllConcerts ? t("common.showLess") : `${concerts.length - 3} ${t("common.showMore")}`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sheet music file */}
        <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
          <h3 className="text-base font-semibold mb-3">{t("songs.sheetMusicTitle")}</h3>
          {current.hasSheetMusicFile ? (
            <div>
              {pdfUrl && (
                <div className="mb-3">
                  <PdfPreview url={pdfUrl} onClick={handleViewPdf} />
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleViewPdf}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
                >
                  <FileText size={16} />
                  {t("songs.viewFullPdf")}
                </button>
                <button
                  onClick={handleDeleteSheetMusic}
                  className="flex items-center gap-1 text-sm text-red-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                <Upload size={16} />
                {uploading ? t("common.uploading") : t("songs.uploadPdf")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

