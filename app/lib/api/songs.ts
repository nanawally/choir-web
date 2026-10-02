import { apiFetch, getToken, API_URL } from "../apiClient";

export type Song = {
  id: string;
  name: string;
  composer: string | null;
  arranger: string | null;
  lyricist: string | null;
  delning: string | null;
  languages: string | null;
  length: string | null;
  accompanied: boolean | null;
  instrument: string | null;
  year: number | null;
  collectionName: string | null;
  hasSoloists: boolean | null;
  soloistNames: string | null;
  hasSheetMusic: boolean;
  hasSheetMusicFile: boolean;
  lyrics: string | null;
};

export async function listSongs(): Promise<Song[]> {
  const res = await apiFetch("/songs");
  return res.json();
}

export async function createSong(name: string): Promise<Song | null> {
  const res = await apiFetch("/songs", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.ok ? res.json() : null;
}

export async function updateSong(id: string, song: Omit<Song, "id">): Promise<boolean> {
  const { hasSheetMusicFile, ...payload } = song;
  const res = await apiFetch(`/songs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function deleteSong(id: string): Promise<boolean> {
  const res = await apiFetch(`/songs/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function listSongConcerts(songId: string): Promise<{ id: string; name: string }[]> {
  const res = await apiFetch(`/songs/${songId}/concerts`);
  return res.json();
}

// Sheet music

export async function uploadSheetMusic(songId: string, file: File): Promise<{ originalSize: number; compressedSize: number } | null> {
  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();
  const res = await fetch(`${API_URL}/songs/${songId}/sheet-music`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return res.ok ? res.json() : null;
}

export function getSheetMusicUrl(songId: string): string {
  return `${API_URL}/songs/${songId}/sheet-music`;
}

export async function deleteSheetMusic(songId: string): Promise<boolean> {
  const res = await apiFetch(`/songs/${songId}/sheet-music`, { method: "DELETE" });
  return res.ok;
}

// Audio files (stämfiler)

export type AudioFile = { id: string; voicePartId: string | null; fileName: string };

export async function listAudioFiles(songId: string): Promise<AudioFile[]> {
  const res = await apiFetch(`/songs/${songId}/audio-files`);
  return res.json();
}

export async function uploadAudioFile(songId: string, file: File, voicePartId?: string): Promise<AudioFile | null> {
  const formData = new FormData();
  formData.append("file", file);
  if (voicePartId) formData.append("voicePartId", voicePartId);
  const token = getToken();
  const res = await fetch(`${API_URL}/songs/${songId}/audio-files`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return res.ok ? res.json() : null;
}

export async function deleteAudioFile(fileId: string): Promise<boolean> {
  const res = await apiFetch(`/songs/audio-files/${fileId}`, { method: "DELETE" });
  return res.ok;
}

export function getAudioStreamUrl(fileId: string): string {
  return `${API_URL}/songs/audio-files/${fileId}/stream`;
}

// Links (YouTube, Spotify, etc.)

export type SongLink = { id: string; url: string; label: string | null };

export async function listSongLinks(songId: string): Promise<SongLink[]> {
  const res = await apiFetch(`/songs/${songId}/links`);
  return res.json();
}

export async function addSongLink(songId: string, url: string, label?: string): Promise<SongLink | null> {
  const res = await apiFetch(`/songs/${songId}/links`, {
    method: "POST",
    body: JSON.stringify({ url, label: label || null }),
  });
  return res.ok ? res.json() : null;
}

export async function deleteSongLink(linkId: string): Promise<boolean> {
  const res = await apiFetch(`/songs/links/${linkId}`, { method: "DELETE" });
  return res.ok;
}