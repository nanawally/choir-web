"use client";

import type { Song } from "../lib/api";
import { useTranslation } from "../lib/LanguageContext";

export function SongFormFields({
  form,
  set,
}: {
  form: Song;
  set: <K extends keyof Song>(key: K, value: Song[K]) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <Field label={t("common.name")}>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          autoFocus
        />
      </Field>
      <Field label={t("songs.composer")}>
        <input
          value={form.composer ?? ""}
          onChange={(e) => set("composer", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </Field>
      <Field label={t("songs.arranger")}>
        <input
          value={form.arranger ?? ""}
          onChange={(e) => set("arranger", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </Field>
      <Field label={t("songs.delning")}>
        <input
          value={form.delning ?? ""}
          onChange={(e) => set("delning", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </Field>
      <Field label={t("songs.languagesHint")}>
        <input
          value={form.languages ?? ""}
          onChange={(e) => set("languages", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </Field>
      <Field label={t("songs.lengthHint")}>
        <input
          value={form.length ?? ""}
          onChange={(e) => set("length", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          placeholder="3:45"
        />
      </Field>
      <div className="flex items-center gap-4">
        <Field label={t("songs.accompanied")}>
          <select
            value={form.accompanied == null ? "" : form.accompanied ? "yes" : "no"}
            onChange={(e) => {
              const v = e.target.value;
              set("accompanied", v === "" ? null : v === "yes");
              if (v !== "yes") set("instrument", null);
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">—</option>
            <option value="yes">{t("common.yes")}</option>
            <option value="no">{t("common.no")}</option>
          </select>
        </Field>
        {form.accompanied && (
          <Field label={t("songs.instrument")}>
            <input
              value={form.instrument ?? ""}
              onChange={(e) => set("instrument", e.target.value || null)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              placeholder="Piano"
            />
          </Field>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Field label={t("songs.soloists")}>
          <select
            value={form.hasSoloists == null ? "" : form.hasSoloists ? "yes" : "no"}
            onChange={(e) => {
              const v = e.target.value;
              set("hasSoloists", v === "" ? null : v === "yes");
              if (v !== "yes") set("soloistNames", null);
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">—</option>
            <option value="yes">{t("common.yes")}</option>
            <option value="no">{t("common.no")}</option>
          </select>
        </Field>
        {form.hasSoloists && (
          <Field label={t("songs.soloistNamesHint")}>
            <input
              value={form.soloistNames ?? ""}
              onChange={(e) => set("soloistNames", e.target.value || null)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              placeholder="Anna, Erik"
            />
          </Field>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Field label={t("songs.year")}>
          <input
            type="number"
            value={form.year ?? ""}
            onChange={(e) => set("year", e.target.value ? parseInt(e.target.value) : null)}
            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </Field>
        <Field label={t("songs.sheetMusic")}>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={form.hasSheetMusic}
              onChange={(e) => set("hasSheetMusic", e.target.checked)}
            />
            {t("songs.available")}
          </label>
        </Field>
      </div>
      <Field label={t("songs.collection")}>
        <input
          value={form.collectionName ?? ""}
          onChange={(e) => set("collectionName", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-0.5">{label}</label>
      {children}
    </div>
  );
}
