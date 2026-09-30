"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "../../lib/LanguageContext";
import NavSidebar from "../../components/NavSidebar";
import {
  listBaseFormations,
  createBaseFormation,
  deleteFormation,
  renameFormation,
} from "../../lib/api";

type BaseFormation = { id: string; name: string };

export default function BaseFormationsPage() {
  const { t } = useTranslation();
  const [formations, setFormations] = useState<BaseFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    listBaseFormations()
      .then(setFormations)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    const f = await createBaseFormation(newName.trim());
    if (f) {
      setFormations([...formations, f]);
      setNewName("");
      setShowAdd(false);
    }
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    if (await renameFormation(id, renameValue.trim())) {
      setFormations(
        formations.map((f) =>
          f.id === id ? { ...f, name: renameValue.trim() } : f,
        ),
      );
    }
    setRenamingId(null);
  }

  async function handleDelete(id: string) {
    const formation = formations.find((f) => f.id === id);
    if (!window.confirm(t("baseFormations.confirmDelete").replace("{name}", formation?.name ?? ""))) return;
    if (await deleteFormation(id)) {
      setFormations(formations.filter((f) => f.id !== id));
    }
  }

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6 text-center">
          {t("baseFormations.title")}
        </h1>

        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted">
              {t("baseFormations.description")}
            </span>
            <button
              onClick={() => setShowAdd(true)}
              className="px-3 py-2 btn-primary text-sm font-medium shrink-0 ml-4"
            >
              {t("baseFormations.newFormation")}
            </button>
          </div>

          {showAdd && (
            <div className="flex items-center gap-2 mb-4 p-3 border border-border rounded-lg bg-hover-bg">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setShowAdd(false);
                    setNewName("");
                  }
                }}
                placeholder={t("baseFormations.formationName")}
                className="border border-border rounded px-2 py-1 text-sm flex-1"
                autoFocus
              />
              <button
                onClick={handleCreate}
                className="px-3 py-1 btn-primary text-sm"
              >
                {t("common.create")}
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewName("");
                }}
                className="px-3 py-1 border border-border rounded text-sm"
              >
                {t("common.cancel")}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {[...formations].sort((a, b) => a.name.localeCompare(b.name)).map((f) => (
              <div
                key={f.id}
                className="border border-border rounded-lg px-4 py-3 flex items-center justify-between hover:bg-hover-bg"
              >
                {renamingId === f.id ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(f.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="border border-border rounded px-2 py-0.5 text-sm"
                    autoFocus
                  />
                ) : (
                  <Link
                    href={`/base-formations/${f.id}`}
                    className="font-medium hover:text-link"
                  >
                    {f.name}
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRenamingId(f.id);
                      setRenameValue(f.name);
                    }}
                    className="text-subtle hover:text-muted text-xs"
                  >
                    {t("common.rename")}
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-danger hover:text-danger-hover text-xs"
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!loading && formations.length === 0 && !showAdd && (
            <p className="text-subtle text-sm text-center mt-8">
              {t("baseFormations.noFormations")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
