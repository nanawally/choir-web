import { apiFetch } from "../apiClient";

export type Me = { username: string; role: string };

export async function getMe(): Promise<Me | null> {
  const res = await apiFetch("/me");
  return res.ok ? res.json() : null;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<true | "wrong_password" | "error"> {
  const res = await apiFetch("/me/password", {
    method: "PUT",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (res.ok) return true;
  if (res.status === 401) return "wrong_password";
  return "error";
}

export async function deleteMyAccount(password: string): Promise<true | "wrong_password" | "error"> {
  const res = await apiFetch("/me", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
  if (res.ok) return true;
  if (res.status === 401) return "wrong_password";
  return "error";
}
