"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/apiClient";
import { useTranslation } from "../../lib/LanguageContext";

function SetupForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [username, setUsername] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!token) { setInvalid(true); setLoading(false); return; }
    apiFetch(`/setup/${token}`).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username);
      } else {
        setInvalid(true);
      }
      setLoading(false);
    });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("setup.mismatch"));
      return;
    }
    const res = await apiFetch(`/setup/${token}`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setDone(true);
    } else {
      setError(t("setup.invalidToken"));
    }
  }

  const wrapper = "flex min-h-screen items-center justify-center";
  const inner = "flex flex-col gap-4 w-80 max-w-[calc(100vw-2rem)]";

  if (loading) {
    return (
      <div className={wrapper}>
        <p className="text-muted">{t("setup.loading")}</p>
      </div>
    );
  }

  if (invalid || !token) {
    return (
      <div className={wrapper}>
        <div className={inner}>
          <h1 className="text-2xl font-bold text-center">{t("setup.title")}</h1>
          <p className="text-danger text-sm text-center">{t("setup.invalidToken")}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className={wrapper}>
        <div className={inner}>
          <h1 className="text-2xl font-bold text-center">{t("setup.title")}</h1>
          <p className="text-success text-sm text-center">{t("setup.success")}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 btn-primary text-sm font-medium"
          >
            {t("setup.goToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <div className={inner}>
        <h1 className="text-2xl font-bold text-center">{t("setup.title")}</h1>
        {username && (
          <p className="text-sm text-muted text-center">
            {t("setup.intro")}{" "}
            <span className="font-mono font-medium text-foreground">{username}</span>
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder={t("setup.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded bg-surface text-sm"
            autoFocus
          />
          <input
            type="password"
            placeholder={t("setup.confirmPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded bg-surface text-sm"
          />
          {error && <p className="text-danger text-sm text-center">{error}</p>}
          <button type="submit" className="px-4 py-2 btn-primary text-sm font-medium">
            {t("setup.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetupPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted">{t("setup.loading")}</p></div>}>
      <SetupForm />
    </Suspense>
  );
}
