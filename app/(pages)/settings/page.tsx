"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import NavSidebar from "../../components/NavSidebar";
import { useTranslation } from "../../lib/LanguageContext";
import { getTokenRole, clearToken } from "../../lib/apiClient";
import { getMe, changePassword, deleteMyAccount } from "../../lib/api/me";
import { useRouter } from "next/navigation";

type Theme = "system" | "light" | "dark";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem("melisma-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* SSR */
  }
  return "system";
}

function applyTheme(theme: Theme) {
  localStorage.setItem("melisma-theme", theme);
  if (
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme:dark)").matches)
  ) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export default function SettingsPage() {
  const { lang, setLang, t } = useTranslation();
  const router = useRouter();
  const isAdmin = useSyncExternalStore(
    () => () => {},
    () => getTokenRole() === "admin",
    () => false,
  );
  const [, forceUpdate] = useState(0);
  const theme = useSyncExternalStore(
    () => () => {},
    getInitialTheme,
    () => "system" as Theme,
  );

  const [username, setUsername] = useState<string | null>(null);

  // Change password modal state
  const [showChangePw, setShowChangePw] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Delete account modal state
  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    getMe().then((me) => { if (me) setUsername(me.username); });
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (newPw !== confirmPw) { setPwError(t("settings.passwordMismatch")); return; }
    setPwLoading(true);
    const result = await changePassword(oldPw, newPw);
    setPwLoading(false);
    if (result === true) {
      setPwSuccess(true);
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } else if (result === "wrong_password") {
      setPwError(t("settings.wrongPassword"));
    } else {
      setPwError("Error");
    }
  }

  function closePwModal() {
    setShowChangePw(false);
    setOldPw(""); setNewPw(""); setConfirmPw("");
    setPwError(null); setPwSuccess(false);
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    setDeleteLoading(true);
    const result = await deleteMyAccount(deletePw);
    setDeleteLoading(false);
    if (result === true) {
      clearToken();
      router.push("/login");
    } else if (result === "wrong_password") {
      setDeleteError(t("settings.wrongPassword"));
    } else {
      setDeleteError("Error");
    }
  }

  function handleThemeChange(next: Theme) {
    applyTheme(next);
    forceUpdate((n) => n + 1);
  }

  const activeBtn = "btn-primary";
  const inactiveBtn = "border border-border text-text-muted hover:bg-hover-bg";

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-[5.56vw]">
        <h1 className="text-4xl font-bold mb-6 text-center">
          {t("settings.title")}
        </h1>

        {/* Change password modal */}
        {showChangePw && (
          <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50" onClick={closePwModal}>
            <div className="bg-surface rounded-lg shadow-lg p-6 max-w-sm w-[calc(100%-2rem)] flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold">{t("settings.changePassword")}</h2>
              {pwSuccess ? (
                <>
                  <p className="text-sm text-success">{t("settings.passwordChanged")}</p>
                  <button onClick={closePwModal} className="px-4 py-2 btn-primary text-sm">{t("common.close")}</button>
                </>
              ) : (
                <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                  <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder={t("settings.currentPassword")} required className="border border-border rounded px-3 py-2 text-sm bg-surface" />
                  <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder={t("settings.newPassword")} required className="border border-border rounded px-3 py-2 text-sm bg-surface" />
                  <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder={t("settings.confirmNewPassword")} required className="border border-border rounded px-3 py-2 text-sm bg-surface" />
                  {pwError && <p className="text-sm text-danger">{pwError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={pwLoading} className="flex-1 px-4 py-2 btn-primary text-sm">{t("common.save")}</button>
                    <button type="button" onClick={closePwModal} className="flex-1 px-4 py-2 border border-border rounded text-sm hover:bg-hover-bg">{t("common.cancel")}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Delete account modal */}
        {showDelete && (
          <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50" onClick={() => setShowDelete(false)}>
            <div className="bg-surface rounded-lg shadow-lg p-6 max-w-sm w-[calc(100%-2rem)] flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-danger">{t("settings.deleteAccount")}</h2>
              <p className="text-sm text-text-muted">{t("settings.deleteAccountConfirm")}</p>
              <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3">
                <input type="password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} placeholder={t("settings.currentPassword")} required className="border border-border rounded px-3 py-2 text-sm bg-surface" />
                {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={deleteLoading} className="flex-1 px-4 py-2 bg-danger text-white rounded text-sm font-medium hover:opacity-90">{t("settings.deleteAccount")}</button>
                  <button type="button" onClick={() => { setShowDelete(false); setDeletePw(""); setDeleteError(null); }} className="flex-1 px-4 py-2 border border-border rounded text-sm hover:bg-hover-bg">{t("common.cancel")}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-md space-y-4">
          {/* Account */}
          <div className="border border-border rounded-lg p-4">
            <p className="text-sm font-medium text-text-muted mb-3">{t("settings.account")}</p>
            {username && <p className="text-sm font-mono mb-3">{username}</p>}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowChangePw(true)} className="px-3 py-1.5 text-sm border border-border rounded hover:bg-hover-bg">
                {t("settings.changePassword")}
              </button>
              <button onClick={() => setShowDelete(true)} className="px-3 py-1.5 text-sm border border-danger text-danger rounded hover:bg-hover-bg">
                {t("settings.deleteAccount")}
              </button>
            </div>
          </div>

          {/* User management — admin only */}
          {isAdmin && (
            <Link
              href="/settings/users"
              className="block border border-border rounded-lg p-4 hover:bg-hover-bg"
            >
              <span className="text-sm font-medium">{t("settings.users")}</span>
            </Link>
          )}
          {/* Permissions — admin only */}
          {isAdmin && (
            <Link
              href="/settings/permissions"
              className="block border border-border rounded-lg p-4 hover:bg-hover-bg"
            >
              <span className="text-sm font-medium">{t("settings.permissions")}</span>
            </Link>
          )}
          {/* Language */}
          <div className="border border-border rounded-lg p-4">
            <label className="block text-sm font-medium text-text-muted mb-2">
              {t("settings.language")}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLang("sv")}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  lang === "sv" ? activeBtn : inactiveBtn
                }`}
              >
                {t("settings.swedish")}
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  lang === "en" ? activeBtn : inactiveBtn
                }`}
              >
                {t("settings.english")}
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="border border-border rounded-lg p-4">
            <label className="block text-sm font-medium text-text-muted mb-2">
              {t("settings.theme")}
            </label>
            <div className="flex gap-2">
              {(["system", "light", "dark"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleThemeChange(opt)}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    theme === opt ? activeBtn : inactiveBtn
                  }`}
                >
                  {t(
                    `settings.theme${opt.charAt(0).toUpperCase()}${opt.slice(1)}` as "settings.themeSystem",
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
