import { apiFetch } from "../apiClient";

export type User = {
  id: string;
  username: string;
  choristId: string | null;
  role: string;
  email: string | null;
  isArchived: boolean;
  isPending: boolean;
};

export async function listUsers(): Promise<User[]> {
  const res = await apiFetch("/users");
  return res.ok ? res.json() : [];
}

export async function createUser(username: string, role = "user"): Promise<{ setupToken: string; setupUrl: string } | null> {
  const res = await apiFetch("/users", {
    method: "POST",
    body: JSON.stringify({ username, role }),
  });
  return res.ok ? res.json() : null;
}

export async function setUserRole(id: string, role: string): Promise<boolean> {
  const res = await apiFetch(`/users/${id}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
  return res.ok;
}

export async function resetUserAccount(id: string): Promise<{ setupToken: string } | null> {
  const res = await apiFetch(`/users/${id}/reset`, { method: "POST" });
  return res.ok ? res.json() : null;
}

export async function archiveUser(id: string): Promise<boolean> {
  const res = await apiFetch(`/users/${id}/archive`, { method: "PUT" });
  return res.ok;
}

export async function unarchiveUser(id: string): Promise<boolean> {
  const res = await apiFetch(`/users/${id}/unarchive`, { method: "PUT" });
  return res.ok;
}

export async function deleteUser(id: string): Promise<boolean> {
  const res = await apiFetch(`/users/${id}`, { method: "DELETE" });
  return res.ok;
}
