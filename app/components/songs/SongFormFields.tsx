"use client";

import type { Song } from "../../lib/api";
import { useTranslation } from "../../lib/LanguageContext";

export type Suggestions = {
  composer: string[];
  arranger: string[];
  lyricist: string[];
  delning: string[];
  languages: string[];
  instrument: string[];
  collectionName: string[];
};

export function extractSuggestions(songs: Song[]): Suggestions {
  function unique(field: keyof Song): string[] {
    const values = songs.map((s) => s[field]).filter((v): v is string => typeof v === "string" && v.length > 0);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }
  return {
    composer: unique("composer"),
    arranger: unique("arranger"),
    lyricist: unique("lyricist"),
    delning: unique("delning"),
    languages: unique("languages"),
    instrument: unique("instrument"),
    collectionName: unique("collectionName"),
  };
}

export function SongFormFields({
  form,
  set,
  suggestions,
}: {
  form: Song;
  set: <K extends keyof Song>(key: K, value: Song[K]) => void;
  suggestions?: Suggestions;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <Field label={t("common.name")}>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full border border-border rounded px-2 py-1 text-sm"
          autoFocus
        />
      </Field>
      <Field label={t("songs.composer")}>
        <input
          value={form.composer ?? ""}
          onChange={(e) => set("composer", e.target.value || null)}
          className="w-full border border-border rounded px-2 py-1 text-sm"
          list={suggestions ? "dl-composer" : undefined}
        />
      </Field>
      <Field label={t("songs.arranger")}>
        <input
          value={form.arranger ?? ""}
          onChange={(e) => set("arranger", e.target.value || null)}
          className="w-full border border-border rounded px-2 py-1 text-sm"
          list={suggestions ? "dl-arranger" : undefined}
        />
      </Field>
      <Field label={t("songs.lyricist")}>
        <input
          value={form.lyricist ?? ""}
          onChange={(e) => set("lyricist", e.target.value || null)}
          className="w-full border border-border rounded px-2 py-1 text-sm"
          list={suggestions ? "dl-lyricist" : undefined}
        />
      </Field>
      <Field label={t("songs.delning")}>
        <input
          value={form.delning ?? ""}
          onChange={(e) => set("delning", e.target.value || null)}
          className="w-full border border-border rounded px-2 py-1 text-sm"
          list={suggestions ? "dl-delning" : undefined}
        />
      </Field>
      <Field label={t("songs.languagesHint")}>
        <input
          value={form.languages ?? ""}
          onChange={(e) => set("languages", e.target.value || null)}
          className="w-full border border-border rounded px-2 py-1 text-sm"
          list={suggestions ? "dl-languages" : undefined}
        />
      </Field>
      <Field label={t("songs.lengthHint")}>
        <input
          value={form.length ?? ""}
          onChange={(e) => set("length", e.target.value || null)}
          className="w-full border border-border rounded px-2 py-1 text-sm"
          placeholder="3:45"
        />
      </Field>
      <div className="flex items-center gap-4">
        <Field label={t("songs.accompanied")}>
          <select
            value={
              form.accompanied == null ? "" : form.accompanied ? "yes" : "no"
            }
            onChange={(e) => {
              const v = e.target.value;
              set("accompanied", v === "" ? null : v === "yes");
              if (v !== "yes") set("instrument", null);
            }}
            className="border border-border rounded px-2 py-1 text-sm"
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
              className="border border-border rounded px-2 py-1 text-sm"
              placeholder="Piano"
              list={suggestions ? "dl-instrument" : undefined}
            />
          </Field>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Field label={t("songs.soloists")}>
          <select
            value={
              form.hasSoloists == null ? "" : form.hasSoloists ? "yes" : "no"
            }
            onChange={(e) => {
              const v = e.target.value;
              set("hasSoloists", v === "" ? null : v === "yes");
              if (v !== "yes") set("soloistNames", null);
            }}
            className="border border-border rounded px-2 py-1 text-sm"
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
              className="border border-border rounded px-2 py-1 text-sm"
              placeholder="Anna, Erik"
            />
          </Field>
        )}
      </div>
      <Field label={t("songs.year")}>
        <input
          type="number"
          value={form.year ?? ""}
          onChange={(e) =>
            set("year", e.target.value ? parseInt(e.target.value) : null)
          }
          className="w-24 border border-border rounded px-2 py-1 text-sm"
        />
      </Field>
      <Field label={t("songs.collection")}>
        <input
          value={form.collectionName ?? ""}
          onChange={(e) => set("collectionName", e.target.value || null)}
          className="w-full border border-border rounded px-2 py-1 text-sm"
          list={suggestions ? "dl-collection" : undefined}
        />
      </Field>
      <Field label={t("songs.lyrics")}>
        <textarea
          value={form.lyrics ?? ""}
          onChange={(e) => set("lyrics", e.target.value || null)}
          className="w-full border border-border rounded px-2 py-1 text-sm min-h-[120px]"
          rows={6}
        />
      </Field>

      {suggestions && (
        <>
          <datalist id="dl-composer">{suggestions.composer.map((v) => <option key={v} value={v} />)}</datalist>
          <datalist id="dl-arranger">{suggestions.arranger.map((v) => <option key={v} value={v} />)}</datalist>
          <datalist id="dl-lyricist">{suggestions.lyricist.map((v) => <option key={v} value={v} />)}</datalist>
          <datalist id="dl-delning">{suggestions.delning.map((v) => <option key={v} value={v} />)}</datalist>
          <datalist id="dl-languages">{suggestions.languages.map((v) => <option key={v} value={v} />)}</datalist>
          <datalist id="dl-instrument">{suggestions.instrument.map((v) => <option key={v} value={v} />)}</datalist>
          <datalist id="dl-collection">{suggestions.collectionName.map((v) => <option key={v} value={v} />)}</datalist>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-0.5">
        {label}
      </label>
      {children}
    </div>
  );
}
