import { apiFetch } from "../apiClient";

export async function listChorists(includeArchived = false) {
  const res = await apiFetch(`/chorists${includeArchived ? "?includeArchived=true" : ""}`);
  return res.json();
}

export async function createChorist(firstName: string, lastName: string, isSectionLeader = false) {
  const res = await apiFetch("/chorists", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName, isSectionLeader }),
  });
  return res.ok ? res.json() : null;
}

export async function updateChorist(id: string, firstName: string, lastName: string, isSectionLeader = false) {
  const res = await apiFetch(`/chorists/${id}`, {
    method: "PUT",
    body: JSON.stringify({ firstName, lastName, isSectionLeader }),
  });
  return res.ok;
}

export async function archiveChorist(id: string) {
  const res = await apiFetch(`/chorists/${id}/archive`, { method: "PUT" });
  return res.ok;
}

export async function unarchiveChorist(id: string) {
  const res = await apiFetch(`/chorists/${id}/unarchive`, { method: "PUT" });
  return res.ok;
}

export async function deleteChorist(id: string) {
  const res = await apiFetch(`/chorists/${id}`, { method: "DELETE" });
  return res.ok;
}