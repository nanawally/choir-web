import { apiFetch } from "../apiClient";

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

export async function renameFormation(id: string, name: string) {
  const res = await apiFetch(`/formations/${id}/name`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  return res.ok;
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

export async function updateRowSizes(formationId: string, rowSizes: number[]) {
  const res = await apiFetch(`/formations/${formationId}/row-sizes`, {
    method: "PUT",
    body: JSON.stringify({ rowSizes: JSON.stringify(rowSizes) }),
  });
  return res.ok;
}

// Base formations

export async function listBaseFormations() {
  const res = await apiFetch("/base-formations");
  return res.json();
}

export async function createBaseFormation(name: string) {
  const res = await apiFetch("/base-formations", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.ok ? res.json() : null;
}

export async function copyBaseIntoConcert(formationId: string, concertId: string) {
  const res = await apiFetch(`/formations/${formationId}/copy-into-concert`, {
    method: "POST",
    body: JSON.stringify({ concertId }),
  });
  return res.ok ? res.json() : null;
}

// Song formations

export async function listSongFormations(concertSongId: string) {
  const res = await apiFetch(`/concert-songs/${concertSongId}/formations`);
  return res.json();
}

export async function setSongFormations(concertSongId: string, formationIds: string[]) {
  const res = await apiFetch(`/concert-songs/${concertSongId}/formations`, {
    method: "PUT",
    body: JSON.stringify({ formationIds }),
  });
  return res.ok;
}