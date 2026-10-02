"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Song,
  type AudioFile,
  type SongLink,
  listSongConcerts,
  uploadSheetMusic,
  getSheetMusicUrl,
  deleteSheetMusic,
  getToken,
  listAudioFiles,
  uploadAudioFile,
  deleteAudioFile,
  getAudioStreamUrl,
  listSongLinks,
  addSongLink,
  deleteSongLink,
  listVoiceGroups,
} from "../../lib/api";
import dynamic from "next/dynamic";

const PdfPreview = dynamic(() => import("../../components/PdfPreview"), {
  ssr: false,
});
const PdfViewer = dynamic(() => import("../../components/PdfViewer"), {
  ssr: false,
});
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
  Upload,
  FileText,
  Trash,
  Plus,
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
    ? details
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return (
    <div>
      <span className="block text-xs text-muted mb-0.5">{label}</span>
      <span className="text-sm">{t("common.yes")}</span>
      {items.length > 0 && (
        <ul className="mt-1 ml-4 list-disc text-sm text-foreground">
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
      <span className="block text-xs text-muted mb-0.5">{label}</span>
      <span className="text-sm">{value || "—"}</span>
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
  const [concerts, setConcerts] = useState<{ id: string; name: string }[]>([]);
  const [showAllConcerts, setShowAllConcerts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "sheet" | "lyrics" | "listening">("info");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Listening tab state
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [songLinks, setSongLinks] = useState<SongLink[]>([]);
  const [voiceParts, setVoiceParts] = useState<{ id: string; name: string }[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [selectedVoicePart, setSelectedVoicePart] = useState<string>("");

  useEffect(() => {
    listSongConcerts(song.id).then(setConcerts);
  }, [song.id]);

  useEffect(() => {
    listAudioFiles(song.id).then(setAudioFiles);
    listSongLinks(song.id).then(setSongLinks);
    listVoiceGroups().then((groups: { id: string; name: string; parts: { id: string; name: string }[] }[]) => {
      const parts: { id: string; name: string }[] = [];
      for (const g of groups) {
        for (const p of g.parts) {
          parts.push({ id: p.id, name: `${g.name} – ${p.name}` });
        }
      }
      setVoiceParts(parts);
    });
  }, [song.id]);

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

  async function handleUpload(file: File) {
    setUploading(true);
    const result = await uploadSheetMusic(current.id, file);
    if (result) {
      setCurrent((c) => ({
        ...c,
        hasSheetMusicFile: true,
        hasSheetMusic: true,
      }));
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

        {/* Tab: Info */}
        {tab === "info" && (
          <>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-6">
              <DetailCell
                label={t("songs.arranger")}
                value={current.arranger ?? "—"}
              />
              <DetailCell
                label={t("songs.lyricist")}
                value={current.lyricist ?? "—"}
              />
              <DetailCell
                label={t("songs.delning")}
                value={current.delning ?? "—"}
              />
              <DetailCell
                label={t("songs.languages")}
                value={current.languages ?? "—"}
              />
              <DetailCell label={t("songs.length")} value={current.length ?? "—"} />
              <DetailCell
                label={t("songs.year")}
                value={current.year?.toString() ?? "—"}
              />
              <DetailCell
                label={t("songs.sheetMusic")}
                value={current.hasSheetMusicFile ? t("common.yes") : t("common.no")}
              />
              <DetailCell
                label={t("songs.collection")}
                value={current.collectionName ?? "—"}
              />
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
                  <span className="block text-xs text-muted mb-0.5">
                    {t("songs.usedIn")}
                  </span>
                  <ul className="text-sm text-foreground space-y-0.5">
                    {visibleConcerts.map((c) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                  {concerts.length > 3 && (
                    <button
                      onClick={() => setShowAllConcerts(!showAllConcerts)}
                      className="text-xs text-link hover:underline mt-1"
                    >
                      {showAllConcerts
                        ? t("common.showLess")
                        : `${concerts.length - 3} ${t("common.showMore")}`}
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* PDF preview in info tab */}
            {current.hasSheetMusicFile && pdfUrl && (
              <div className="mt-2">
                <PdfPreview url={pdfUrl} onClick={handleViewPdf} />
              </div>
            )}
          </>
        )}

        {/* Tab: Sheet Music */}
        {tab === "sheet" && (
          <div>
            {current.hasSheetMusicFile ? (
              <div>
                {pdfUrl && (
                  <div className="mb-3">
                    <PdfViewer url={pdfUrl} />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleViewPdf}
                    className="flex items-center gap-1.5 text-sm text-link hover:text-link-light-text"
                  >
                    <FileText size={16} />
                    {t("songs.viewFullPdf")}
                  </button>
                  <button
                    onClick={handleDeleteSheetMusic}
                    className="flex items-center gap-1 text-sm text-danger hover:text-danger-hover"
                  >
                    <Trash size={14} />
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
                  className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground disabled:opacity-50"
                >
                  <Upload size={16} />
                  {uploading ? t("common.uploading") : t("songs.uploadPdf")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Lyrics */}
        {tab === "lyrics" && (
          <div>
            {current.lyrics ? (
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {current.lyrics}
              </pre>
            ) : (
              <p className="text-sm text-subtle">{t("songs.noLyrics")}</p>
            )}
          </div>
        )}

        {/* Tab: Listening */}
        {tab === "listening" && (
          <div className="space-y-6">
            {/* Voice Part Files */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t("songs.voicePartFiles")}</h3>
              {audioFiles.length === 0 ? (
                <p className="text-sm text-subtle">{t("songs.noAudioFiles")}</p>
              ) : (
                <div className="space-y-2">
                  {audioFiles.map((af) => {
                    const partName = af.voicePartId
                      ? voiceParts.find((vp) => vp.id === af.voicePartId)?.name ?? t("songs.general")
                      : t("songs.general");
                    const streamUrl = getAudioStreamUrl(af.id);
                    return (
                      <div key={af.id} className="flex items-center gap-3 p-2 bg-hover-bg rounded">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-muted block">{partName}</span>
                          <span className="text-sm truncate block">{af.fileName}</span>
                        </div>
                        <audio src={streamUrl} controls preload="none" className="h-8 w-40" />
                        <button
                          onClick={async () => {
                            if (!window.confirm(t("songs.confirmDeleteAudio"))) return;
                            if (await deleteAudioFile(af.id)) {
                              setAudioFiles((prev) => prev.filter((f) => f.id !== af.id));
                            }
                          }}
                          className="text-danger hover:text-danger-hover"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <select
                  value={selectedVoicePart}
                  onChange={(e) => setSelectedVoicePart(e.target.value)}
                  className="border border-border rounded px-2 py-1 text-sm"
                >
                  <option value="">{t("songs.general")}</option>
                  {voiceParts.map((vp) => (
                    <option key={vp.id} value={vp.id}>{vp.name}</option>
                  ))}
                </select>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingAudio(true);
                    const result = await uploadAudioFile(
                      current.id,
                      file,
                      selectedVoicePart || undefined,
                    );
                    if (result) {
                      setAudioFiles((prev) => [...prev, result]);
                    }
                    setUploadingAudio(false);
                    if (audioInputRef.current) audioInputRef.current.value = "";
                  }}
                />
                <button
                  onClick={() => audioInputRef.current?.click()}
                  disabled={uploadingAudio}
                  className="flex items-center gap-1 text-sm text-muted hover:text-foreground disabled:opacity-50"
                >
                  <Upload size={14} />
                  {uploadingAudio ? t("common.uploading") : t("songs.uploadAudio")}
                </button>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t("songs.links")}</h3>
              {songLinks.length === 0 ? (
                <p className="text-sm text-subtle">{t("songs.noLinks")}</p>
              ) : (
                <div className="space-y-2">
                  {songLinks.map((link) => (
                    <div key={link.id} className="flex items-center gap-3 p-2 bg-hover-bg rounded">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-link hover:underline truncate flex-1 min-w-0"
                      >
                        {link.label || link.url}
                      </a>
                      <button
                        onClick={async () => {
                          if (await deleteSongLink(link.id)) {
                            setSongLinks((prev) => prev.filter((l) => l.id !== link.id));
                          }
                        }}
                        className="text-danger hover:text-danger-hover"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <input
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder={t("songs.linkUrl")}
                  className="border border-border rounded px-2 py-1 text-sm flex-1"
                />
                <input
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder={t("songs.linkLabel")}
                  className="border border-border rounded px-2 py-1 text-sm w-32"
                />
                <button
                  onClick={async () => {
                    if (!newLinkUrl.trim()) return;
                    const link = await addSongLink(
                      current.id,
                      newLinkUrl.trim(),
                      newLinkLabel.trim() || undefined,
                    );
                    if (link) {
                      setSongLinks((prev) => [...prev, link]);
                      setNewLinkUrl("");
                      setNewLinkLabel("");
                    }
                  }}
                  className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
                >
                  <Plus size={14} />
                  {t("songs.addLink")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
