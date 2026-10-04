import { useEffect, useState } from "react";
import {
  listSongs,
  createSong,
  updateSong,
  deleteSong,
  uploadSheetMusic,
  type Song,
} from "../lib/api";
import { useTranslation } from "../lib/LanguageContext";
import type { TranslationKey } from "../lib/translations";

export type ColumnDef = {
  key: keyof Song;
  labelKey: TranslationKey;
  render?: (song: Song, t: (key: TranslationKey) => string) => string;
  width?: string;
};

export const ALL_COLUMNS: ColumnDef[] = [
  { key: "name", labelKey: "common.name" },
  { key: "composer", labelKey: "songs.composer", width: "120px" },
  { key: "arranger", labelKey: "songs.arranger", width: "120px" },
  { key: "lyricist", labelKey: "songs.lyricist", width: "120px" },
  { key: "delning", labelKey: "songs.delning", width: "100px" },
  { key: "languages", labelKey: "songs.languages", width: "120px" },
  { key: "length", labelKey: "songs.length", width: "80px" },
  {
    key: "accompanied",
    labelKey: "songs.accompanied",
    width: "130px",
    render: (s, t) => {
      if (s.accompanied == null) return "";
      if (!s.accompanied) return t("common.no");
      return s.instrument ? `${t("common.yes")} — ${s.instrument}` : t("common.yes");
    },
  },
  { key: "year", labelKey: "songs.year", width: "70px" },
  { key: "collectionName", labelKey: "songs.collection", width: "130px" },
  {
    key: "hasSoloists",
    labelKey: "songs.soloists",
    width: "120px",
    render: (s, t) => {
      if (s.hasSoloists == null) return "";
      if (!s.hasSoloists) return t("common.no");
      return s.soloistNames ? `${t("common.yes")} — ${s.soloistNames}` : t("common.yes");
    },
  },
  {
    key: "hasSheetMusicFile",
    labelKey: "songs.sheetMusic",
    width: "100px",
    render: (s, t) => (s.hasSheetMusicFile ? t("common.yes") : t("common.no")),
  },
];

export type FilterColumnDef = { key: keyof Song; labelKey: TranslationKey; type: "text" | "bool" | "range" };

export const FILTER_COLUMNS: FilterColumnDef[] = [
  { key: "composer", labelKey: "songs.composer", type: "text" },
  { key: "arranger", labelKey: "songs.arranger", type: "text" },
  { key: "delning", labelKey: "songs.delning", type: "text" },
  { key: "languages", labelKey: "songs.languages", type: "text" },
  { key: "accompanied", labelKey: "songs.accompanied", type: "bool" },
  { key: "year", labelKey: "songs.year", type: "range" },
  { key: "collectionName", labelKey: "songs.collection", type: "text" },
  { key: "hasSoloists", labelKey: "songs.soloists", type: "bool" },
  { key: "hasSheetMusicFile", labelKey: "songs.sheetMusic", type: "bool" },
];

export type ActiveFilter = { column: string; columnLabel: string; value: string };
export type YearRange = { from: number | null; to: number | null };

export function useSongs() {
  const { t } = useTranslation();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  useEffect(() => {
    listSongs().then(setSongs).finally(() => setLoading(false));
  }, []);

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

  return {
    songs,
    loading,
    showAdd,
    setShowAdd,
    editingSong,
    setEditingSong,
    handleCreate,
    handleDelete,
    handleSave,
  };
}
