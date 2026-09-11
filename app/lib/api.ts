const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export async function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

// Songs

export async function listSongs() {
  const res = await apiFetch("/songs");
  return res.json();
}

export async function createSong(name: string) {
  const res = await apiFetch("/songs", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.ok ? res.json() : null;
}

export async function renameSong(id: string, name: string) {
  const res = await apiFetch(`/songs/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  return res.ok;
}

export async function deleteSong(id: string) {
  const res = await apiFetch(`/songs/${id}`, { method: "DELETE" });
  return res.ok;
}

// Chorists

export async function listChorists() {
  const res = await apiFetch("/chorists");
  return res.json();
}

export async function createChorist(name: string) {
  const res = await apiFetch("/chorists", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.ok ? res.json() : null;
}

export async function renameChorist(id: string, name: string) {
  const res = await apiFetch(`/chorists/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  return res.ok;
}

export async function deleteChorist(id: string) {
  const res = await apiFetch(`/chorists/${id}`, { method: "DELETE" });
  return res.ok;
}

// Concerts

export async function listConcerts() {
  const res = await apiFetch("/concerts");
  return res.json();
}

export async function createConcert(name: string) {
  const res = await apiFetch("/concerts", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.ok ? res.json() : null;
}

export async function renameConcert(id: string, name: string) {
  const res = await apiFetch(`/concerts/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
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

// ConcertSongs

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
    method: "DELETE" 
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

export async function saveHiddenChorists(
  concertSongId: string,
  choristIds: string[],
) {
  const res = await apiFetch(`/concert-songs/${concertSongId}/hidden`, {
    method: "PUT",
    body: JSON.stringify({ choristIds }),
  });
  return res.ok;
}

// ConcertChorists

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

// Formations

export async function listFormations(concertId: string) {
  const res = await apiFetch(`/concerts/${concertId}/formations`);
  return res.json();
}

export async function createFormation(concertId: string, name: string) {
  const res = await apiFetch(`/concerts/${concertId}/formations`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.ok ? res.json() : null;
}

export async function loadFormation(id: string) {
  const res = await apiFetch(`/formations/${id}`);
  return res.ok ? res.json() : null;
}

export async function deleteFormation(id: string) {
  const res = await apiFetch(`/formations/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function savePlacements(
  formationId: string,
  placements: { choristId: string; gridX: number; gridY: number }[],
) {
  const res = await apiFetch(`/formations/${formationId}/placements`, {
    method: "PUT",
    body: JSON.stringify(placements),
  });
  return res.ok;
}

export async function duplicateFormation(id: string) {
  const res = await apiFetch(`/formations/${id}/duplicate`, { method: "POST" });
  return res.ok ? res.json() : null;
}

export async function copyFormationToConcert(formationId: string, targetConcertId: string) {
  const res = await apiFetch(`/formations/${formationId}/copy`, {
    method: "POST",
    body: JSON.stringify({ targetConcertId }),
  });
  return res.ok ? res.json() : null;
}

// SongFormations

export async function listSongFormations(concertSongId: string) {
  const res = await apiFetch(`/concert-songs/${concertSongId}/formations`)
  return res.json();
}

export async function setSongFormations(concertSongId: string, formationIds: string[]) {
  const res = await apiFetch(`/concert-songs/${concertSongId}/formations`, {
    method: "PUT",
    body: JSON.stringify({ formationIds }),
  });
  return res.ok;
}

// Voice groups

export async function listVoiceGroups() {
  const res = await apiFetch("/voice-groups");
  return res.json();
}

export async function createVoiceGroup(name: string) {
  const res = await apiFetch("/voice-groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.ok ? res.json() : null;
}

export async function deleteVoiceGroup(id: string) {
  const res = await apiFetch(`/voice-groups/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function addVoicePart(
  groupId: string,
  name: string,
  color: string,
  shape: string,
) {
  const res = await apiFetch(`/voice-groups/${groupId}/parts`, {
    method: "POST",
    body: JSON.stringify({ name, color, shape }),
  });
  return res.ok ? res.json() : null;
}

export async function deleteVoicePart(partId: string) {
  const res = await apiFetch(`/voice-groups/parts/${partId}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function getAssignments(groupId: string) {
  const res = await apiFetch(`/voice-groups/${groupId}/assignments`);
  return res.json();
}

export async function assignChorist(choristId: string, voicePartId: string) {
  const res = await apiFetch("/voice-groups/assignments", {
    method: "POST",
    body: JSON.stringify({ choristId, voicePartId }),
  });
  return res.ok;
}

export async function unassignChorist(groupId: string, choristId: string) {
  const res = await apiFetch(
    `/voice-groups/${groupId}/assignments/${choristId}`,
    { method: "DELETE" },
  );
  return res.ok;
}

// Grid

export async function updateRowSizes(formationId: string, rowSizes: number[]) {
  const res = await apiFetch(`/formations/${formationId}/row-sizes`, {
    method: "PUT",
    body: JSON.stringify({ rowSizes: JSON.stringify(rowSizes) }),
  });
  return res.ok;
}
