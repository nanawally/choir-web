import { apiFetch } from "../apiClient";

// Voice groups

export async function listVoiceGroups() {
  const res = await apiFetch("/voice-groups");
  return res.json();
}

export async function createVoiceGroup(name: string, isStandard = false) {
  const res = await apiFetch("/voice-groups", {
    method: "POST",
    body: JSON.stringify({ name, isStandard }),
  });
  return res.ok ? res.json() : null;
}

export async function renameVoiceGroup(id: string, name: string) {
  const res = await apiFetch(`/voice-groups/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  return res.ok;
}

export async function setVoiceGroupStandard(id: string, isStandard: boolean) {
  const res = await apiFetch(`/voice-groups/${id}/standard`, {
    method: "PUT",
    body: JSON.stringify({ isStandard }),
  });
  return res.ok;
}

export async function deleteVoiceGroup(id: string) {
  const res = await apiFetch(`/voice-groups/${id}`, { method: "DELETE" });
  return res.ok;
}

// Voice parts

export async function addVoicePart(groupId: string, name: string, color: string, shape: string) {
  const res = await apiFetch(`/voice-groups/${groupId}/parts`, {
    method: "POST",
    body: JSON.stringify({ name, color, shape }),
  });
  return res.ok ? res.json() : null;
}

export async function updateVoicePart(partId: string, name: string, color: string, shape: string) {
  const res = await apiFetch(`/voice-groups/parts/${partId}`, {
    method: "PUT",
    body: JSON.stringify({ name, color, shape }),
  });
  return res.ok;
}

export async function reorderVoiceParts(groupId: string, partIds: string[]) {
  const res = await apiFetch(`/voice-groups/${groupId}/parts/reorder`, {
    method: "PUT",
    body: JSON.stringify({ partIds }),
  });
  return res.ok;
}

export async function deleteVoicePart(partId: string) {
  const res = await apiFetch(`/voice-groups/parts/${partId}`, { method: "DELETE" });
  return res.ok;
}

// Assignments

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
  const res = await apiFetch(`/voice-groups/${groupId}/assignments/${choristId}`, {
    method: "DELETE",
  });
  return res.ok;
}