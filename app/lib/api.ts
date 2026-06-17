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

export async function listFormations() {
  const res = await apiFetch("/formations");
  return res.json();
}

export async function createFormation(name: string) {
  const res = await apiFetch("/formations", {
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
