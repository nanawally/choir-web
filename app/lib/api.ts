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
