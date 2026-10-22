import { apiFetch } from "../apiClient";

export type PermissionEntry = {
  feature: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type PermissionGroup = {
  id: string;
  name: string;
  isAdmin: boolean;
  permissions: PermissionEntry[];
  memberIds: string[];
};

export type MyPermissions = {
  isSuperUser: boolean;
  permissions: Record<string, PermissionEntry>;
};

export async function getMyPermissions(): Promise<MyPermissions | null> {
  const res = await apiFetch("/me/permissions");
  return res.ok ? res.json() : null;
}

export async function listPermissionGroups(): Promise<PermissionGroup[]> {
  const res = await apiFetch("/permissions/groups");
  return res.ok ? res.json() : [];
}

export async function createPermissionGroup(name: string): Promise<PermissionGroup | null> {
  const res = await apiFetch("/permissions/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.ok ? res.json() : null;
}

export async function deletePermissionGroup(id: string): Promise<boolean> {
  const res = await apiFetch(`/permissions/groups/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function setGroupPermission(
  groupId: string,
  feature: string,
  canView: boolean,
  canEdit: boolean,
  canDelete: boolean,
): Promise<boolean> {
  const res = await apiFetch(`/permissions/groups/${groupId}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ feature, canView, canEdit, canDelete }),
  });
  return res.ok;
}

export async function addGroupMember(groupId: string, userId: string): Promise<boolean> {
  const res = await apiFetch(`/permissions/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return res.ok;
}

export async function removeGroupMember(groupId: string, userId: string): Promise<boolean> {
  const res = await apiFetch(`/permissions/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  });
  return res.ok;
}
