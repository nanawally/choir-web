import { apiFetch, getToken, API_URL } from "../apiClient";

// Concerts

export async function listConcerts() {
  const res = await apiFetch("/concerts");
  return res.json();
}

export async function createConcert(name: string, date?: string | null) {
  const res = await apiFetch("/concerts", {
    method: "POST",
    body: JSON.stringify({ name, date: date || null }),
  });
  return res.ok ? res.json() : null;
}

export async function updateConcert(id: string, name: string, date?: string | null) {
  const res = await apiFetch(`/concerts/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, date: date || null }),
  });
  return res.ok;
}

export async function deleteConcert(id: string) {
  const res = await apiFetch(`/concerts/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function duplicateConcert(id: string, name: string) {
  const res = await apiFetch(`/concerts/${id}/duplicate`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.ok ? res.json() : null;
}

export async function uploadConcertImage(concertId: string, file: File): Promise<boolean> {
  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();
  const res = await fetch(`${API_URL}/concerts/${concertId}/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return res.ok;
}

export function getConcertImageUrl(concertId: string): string {
  return `${API_URL}/concerts/${concertId}/image`;
}

export async function deleteConcertImage(concertId: string): Promise<boolean> {
  const res = await apiFetch(`/concerts/${concertId}/image`, { method: "DELETE" });
  return res.ok;
}

// Concert songs

export async function listConcertSongs(concertId: string) {
  const res = await apiFetch(`/concerts/${concertId}/songs`);
  return res.json();
}

export async function addSongToConcert(concertId: string, songId: string) {
  const res = await apiFetch(`/concerts/${concertId}/songs`, {
    method: "POST",
    body: JSON.stringify({ songId }),
  });
  return res.ok ? res.json() : null;
}

export async function removeSongFromConcert(concertId: string, concertSongId: string) {
  const res = await apiFetch(`/concerts/${concertId}/songs/${concertSongId}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function reorderConcertSongs(concertId: string, concertSongIds: string[]) {
  const res = await apiFetch(`/concerts/${concertId}/songs/reorder`, {
    method: "PUT",
    body: JSON.stringify({ concertSongIds }),
  });
  return res.ok;
}

export async function getHiddenChorists(concertSongId: string): Promise<string[]> {
  const res = await apiFetch(`/concert-songs/${concertSongId}/hidden`);
  return res.json();
}

export async function saveHiddenChorists(concertSongId: string, choristIds: string[]) {
  const res = await apiFetch(`/concert-songs/${concertSongId}/hidden`, {
    method: "PUT",
    body: JSON.stringify({ choristIds }),
  });
  return res.ok;
}

// Concert chorists

export async function listConcertChorists(concertId: string) {
  const res = await apiFetch(`/concerts/${concertId}/chorists`);
  return res.json();
}

export async function setConcertChorists(concertId: string, choristIds: string[]) {
  const res = await apiFetch(`/concerts/${concertId}/chorists`, {
    method: "PUT",
    body: JSON.stringify({ choristIds }),
  });
  return res.ok;
}