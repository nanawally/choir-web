"use client";

import { useEffect, useState } from "react";
import { listBaseFormations } from "../lib/api";
import { useTranslation } from "../lib/LanguageContext";

type Formation = { id: string; name: string; sortOrder: number };
type BaseFormation = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  formations: Formation[];
  songFormationIds: Set<string>;
  onCreateNew: (name: string) => void;
  onReuse: (formationId: string) => void;
  onCopyBase: (baseFormationId: string) => void;
};

export default function AddFormationModal({
  open,
  onClose,
  formations,
  songFormationIds,
  onCreateNew,
  onReuse,
  onCopyBase,
}: Props) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [baseFormations, setBaseFormations] = useState<BaseFormation[]>([]);

  useEffect(() => {
    if (open) {
      listBaseFormations().then(setBaseFormations);
    }
  }, [open]);

  if (!open) return null;

  const reusable = formations.filter((f) => !songFormationIds.has(f.id));

  return (
    <div className="fixed inset-0 bg-overlay z-30 flex items-center justify-center">
      <div className="bg-surface rounded-lg p-6 w-80 flex flex-col">
        <h2 className="font-bold mb-4">{t("formations.addFormation")}</h2>

        <h3 className="text-sm font-medium mb-2">{t("formations.newEmpty")}</h3>
        <div className="flex gap-1 mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && newName.trim() && onCreateNew(newName.trim())
            }
            placeholder={t("formations.formationName")}
            className="flex-1 border border-border rounded px-2 py-1 text-sm"
          />
          <button
            onClick={() => {
              if (newName.trim()) onCreateNew(newName.trim());
            }}
            className="px-3 py-1 btn-primary text-sm"
          >
            {t("common.create")}
          </button>
        </div>

        {baseFormations.length > 0 && (
          <>
            <h3 className="text-sm font-medium mb-2">
              {t("formations.startFromBase")}
            </h3>
            <ul className="space-y-1 mb-4 max-h-40 overflow-y-auto">
              {baseFormations.map((f) => (
                <li
                  key={f.id}
                  onClick={() => onCopyBase(f.id)}
                  className="text-sm py-1 px-2 rounded hover:bg-surface-alt cursor-pointer"
                >
                  {f.name}
                </li>
              ))}
            </ul>
          </>
        )}

        {reusable.length > 0 && (
          <>
            <h3 className="text-sm font-medium mb-2">
              {t("formations.reuseFromConcert")}
            </h3>
            <ul className="space-y-1 mb-4 max-h-40 overflow-y-auto">
              {reusable.map((f) => (
                <li
                  key={f.id}
                  onClick={() => onReuse(f.id)}
                  className="text-sm py-1 px-2 rounded hover:bg-surface-alt cursor-pointer"
                >
                  {f.name}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded text-sm"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
