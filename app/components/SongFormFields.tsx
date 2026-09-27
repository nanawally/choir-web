"use client";

import type { Song } from "../lib/api";

export function SongFormFields({
  form,
  set,
}: {
  form: Song;
  set: <K extends keyof Song>(key: K, value: Song[K]) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Name">
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          autoFocus
        />
      </Field>
      <Field label="Composer">
        <input
          value={form.composer ?? ""}
          onChange={(e) => set("composer", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Arranger">
        <input
          value={form.arranger ?? ""}
          onChange={(e) => set("arranger", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Delning">
        <input
          value={form.delning ?? ""}
          onChange={(e) => set("delning", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Languages (comma-separated)">
        <input
          value={form.languages ?? ""}
          onChange={(e) => set("languages", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </Field>
      <Field label="Length (MM:SS or MM)">
        <input
          value={form.length ?? ""}
          onChange={(e) => set("length", e.target.value || null)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          placeholder="3:45"
        />
      </Field>
      <div className="flex items-center gap-4">
        <Field label="Accompanied">
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
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        {form.accompanied && (
          <Field label="Instrument">
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
        <Field label="Soloists">
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
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        {form.hasSoloists && (
          <Field label="Soloist names (comma-separated)">
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
        <Field label="Year">
          <input
            type="number"
            value={form.year ?? ""}
            onChange={(e) => set("year", e.target.value ? parseInt(e.target.value) : null)}
            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Sheet music">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={form.hasSheetMusic}
              onChange={(e) => set("hasSheetMusic", e.target.checked)}
            />
            Available
          </label>
        </Field>
      </div>
      <Field label="Collection">
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
