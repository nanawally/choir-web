"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavSidebar from "../../../components/NavSidebar";
import { useTranslation } from "../../../lib/LanguageContext";
import { ChevronLeft } from "lucide-react";
import {
  listUsers,
  createUser,
  setUserRole,
  resetUserAccount,
  archiveUser,
  unarchiveUser,
  deleteUser,
  type User,
} from "../../../lib/api";
import { QRCodeSVG } from "qrcode.react";

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  async function load() {
    setUsers(await listUsers());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function showQr(setupToken: string) {
    setQrUrl(`${window.location.origin}/setup?token=${setupToken}`);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsername.trim()) return;
    const data = await createUser(newUsername.trim(), newRole);
    if (data) { showQr(data.setupToken); setNewUsername(""); await load(); }
  }

  async function handleReset(id: string) {
    const data = await resetUserAccount(id);
    if (data) showQr(data.setupToken);
  }

  async function handleRoleChange(id: string, role: string) {
    await setUserRole(id, role);
    await load();
  }

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-[5.56vw]">
        <Link href="/settings" className="flex items-center gap-1 text-sm text-muted hover:text-text mb-4 w-fit">
          <ChevronLeft size={16} />{t("settings.title")}
        </Link>
        <h1 className="text-4xl font-bold mb-6 text-center">{t("settings.usersTitle")}</h1>

        {qrUrl && (
          <div
            className="fixed inset-0 bg-overlay flex items-center justify-center z-50"
            onClick={() => setQrUrl(null)}
          >
            <div
              className="bg-surface rounded-lg shadow-lg p-6 max-w-sm w-[calc(100%-2rem)] flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold">{t("qrModal.title")}</h2>
              <p className="text-sm text-muted text-center">{t("qrModal.instruction")}</p>
              <QRCodeSVG value={qrUrl} size={200} />
              <code className="text-xs text-muted break-all text-center">{qrUrl}</code>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => { navigator.clipboard.writeText(qrUrl); }}
                  className="flex-1 px-3 py-2 text-sm btn-primary"
                >
                  {t("qrModal.copy")}
                </button>
                <button
                  onClick={() => setQrUrl(null)}
                  className="flex-1 px-3 py-2 text-sm border border-border rounded hover:bg-hover-bg"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-muted">{t("setup.loading")}</p>
        ) : users.length === 0 ? (
          <p className="text-muted">{t("settings.noUsers")}</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto mb-8">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-2">{t("settings.username")}</th>
                    <th className="text-left p-2">{t("settings.role")}</th>
                    <th className="text-left p-2">Status</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border">
                      <td className="p-2 font-mono">{user.username}</td>
                      <td className="p-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="border border-border rounded px-2 py-1 bg-surface text-sm"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="p-2 text-muted">
                        {user.isPending ? t("chorists.accountPending") : t("chorists.accountActive")}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleReset(user.id)}
                            className="text-xs px-2 py-1 border border-border rounded hover:bg-hover-bg"
                          >
                            {user.isPending ? t("settings.showSetupQr") : t("settings.resetAccount")}
                          </button>
                          {user.isArchived ? (
                            <button
                              onClick={async () => { await unarchiveUser(user.id); load(); }}
                              className="text-xs px-2 py-1 border border-border rounded hover:bg-hover-bg"
                            >
                              {t("chorists.unarchive")}
                            </button>
                          ) : (
                            <button
                              onClick={async () => { await archiveUser(user.id); load(); }}
                              className="text-xs px-2 py-1 border border-border rounded hover:bg-hover-bg"
                            >
                              {t("chorists.archive")}
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete ${user.username}?`)) {
                                await deleteUser(user.id); load();
                              }
                            }}
                            className="text-xs px-2 py-1 text-danger border border-danger rounded hover:bg-hover-bg"
                          >
                            {t("common.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden flex flex-col gap-2 mb-8">
              {users.map((user) => (
                <div key={user.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-medium flex-1 min-w-0 truncate">
                      {user.username}
                    </span>
                    <span className="text-xs text-muted shrink-0">
                      {user.isPending ? t("chorists.accountPending") : t("chorists.accountActive")}
                    </span>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="border border-border rounded px-2 py-1 bg-surface text-sm shrink-0"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleReset(user.id)}
                      className="text-xs px-2 py-1 border border-border rounded hover:bg-hover-bg"
                    >
                      {user.isPending ? t("settings.showSetupQr") : t("settings.resetAccount")}
                    </button>
                    {user.isArchived ? (
                      <button
                        onClick={async () => { await unarchiveUser(user.id); load(); }}
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-hover-bg"
                      >
                        {t("chorists.unarchive")}
                      </button>
                    ) : (
                      <button
                        onClick={async () => { await archiveUser(user.id); load(); }}
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-hover-bg"
                      >
                        {t("chorists.archive")}
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (window.confirm(`Delete ${user.username}?`)) {
                          await deleteUser(user.id); load();
                        }
                      }}
                      className="text-xs px-2 py-1 text-danger border border-danger rounded hover:bg-hover-bg ml-auto"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="max-w-sm">
          <h2 className="text-lg font-semibold mb-3">{t("settings.createUser")}</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-2">
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={t("settings.username")}
              className="border border-border rounded px-3 py-2 text-sm bg-surface"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="border border-border rounded px-3 py-2 text-sm bg-surface"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button type="submit" className="px-4 py-2 btn-primary text-sm font-medium">
              {t("settings.createUser")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
