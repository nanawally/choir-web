import { apiFetch, getToken, API_URL } from "../apiClient";
import type { Song } from "./songs";

export type Songbook = {
  id: string;
  name: string;
  date: string | null;
  imageUrl: string | null;
  isPinned: boolean;
};

export type SongbookSong = Song & { sortOrder: number };

export async function listSongbooks(): Promise<Songbook[]> {
  const res = await apiFetch("/songbooks");
  return res.json();
}

export async function createSongbook(name: string, date?: string | null, isPinned?: boolean): Promise<Songbook | null> {
  const res = await apiFetch("/songbooks", {
    method: "POST",
    body: JSON.stringify({ name, date: date || null, isPinned: isPinned ?? false }),
  });
  return res.ok ? res.json() : null;
}

export async function updateSongbook(id: string, name: string, date?: string | null, isPinned?: boolean): Promise<boolean> {
  const res = await apiFetch(`/songbooks/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, date: date || null, isPinned: isPinned ?? false }),
  });
  return res.ok;
}

export async function deleteSongbook(id: string): Promise<boolean> {
  const res = await apiFetch(`/songbooks/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function duplicateSongbook(id: string, name: string): Promise<Songbook | null> {
  const res = await apiFetch(`/songbooks/${id}/duplicate`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.ok ? res.json() : null;
}

export async function uploadSongbookImage(songbookId: string, file: File): Promise<boolean> {
  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();
  const res = await fetch(`${API_URL}/songbooks/${songbookId}/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return res.ok;
}

export function getSongbookImageUrl(songbookId: string): string {
  return `${API_URL}/songbooks/${songbookId}/image`;
}

export async function deleteSongbookImage(songbookId: string): Promise<boolean> {
  const res = await apiFetch(`/songbooks/${songbookId}/image`, { method: "DELETE" });
  return res.ok;
}

export async function listSongbookSongs(songbookId: string): Promise<SongbookSong[]> {
  const res = await apiFetch(`/songbooks/${songbookId}/songs`);
  return res.json();
}

export async function addSongToSongbook(songbookId: string, songId: string): Promise<boolean> {
  const res = await apiFetch(`/songbooks/${songbookId}/songs`, {
    method: "POST",
    body: JSON.stringify({ songId }),
  });
  return res.ok;
}

export async function removeSongFromSongbook(songbookId: string, songId: string): Promise<boolean> {
  const res = await apiFetch(`/songbooks/${songbookId}/songs/${songId}`, { method: "DELETE" });
  return res.ok;
}

export async function reorderSongbookSongs(songbookId: string, songIds: string[]): Promise<boolean> {
  const res = await apiFetch(`/songbooks/${songbookId}/songs/order`, {
    method: "PUT",
    body: JSON.stringify({ songIds }),
  });
  return res.ok;
}
