import { useEffect, useState, useRef } from "react";
import {
  listChorists,
  listVoiceGroups,
  getAssignments,
  unarchiveChorist,
} from "../lib/api";
import { sortVoiceGroups } from "../lib/voiceGroupSort";

export type Chorist = {
  id: string;
  name: string;
  isSectionLeader: boolean;
  isArchived: boolean;
};

export type VoicePart = { id: string; name: string; color: string; shape: string };
export type VoiceGroup = { id: string; name: string; isStandard: boolean; parts: VoicePart[] };
type Assignment = { choristId: string; voicePartId: string };

type ModalState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; chorist: Chorist };

export type ActiveFilter = { groupId: string; groupName: string; partId: string; partName: string };

export function useChorists() {
  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceGroups, setVoiceGroups] = useState<VoiceGroup[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterExpandedGroup, setFilterExpandedGroup] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [archivedChorists, setArchivedChorists] = useState<Chorist[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
        setFilterExpandedGroup(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadData() {
    const [choristData, groupData] = await Promise.all([
      listChorists(),
      listVoiceGroups(),
    ]);
    setChorists(choristData);
    setVoiceGroups(groupData);

    const assignmentMap: Record<string, Assignment[]> = {};
    await Promise.all(
      groupData.map(async (g: VoiceGroup) => {
        assignmentMap[g.id] = await getAssignments(g.id);
      }),
    );
    setAssignments(assignmentMap);
    setLoading(false);
  }

  async function openArchivedModal() {
    const all = await listChorists(true);
    setArchivedChorists(all.filter((c: Chorist) => c.isArchived));
    setArchivedOpen(true);
  }

  async function handleUnarchive(id: string) {
    if (await unarchiveChorist(id)) {
      setArchivedChorists(archivedChorists.filter((c) => c.id !== id));
      await loadData();
    }
  }

  function getPartForChorist(choristId: string, group: VoiceGroup): VoicePart | null {
    const groupAssignments = assignments[group.id] || [];
    const assignment = groupAssignments.find((a) => a.choristId === choristId);
    if (!assignment) return null;
    return group.parts.find((p) => p.id === assignment.voicePartId) || null;
  }

  function getPartSortIndex(choristId: string, group: VoiceGroup): number {
    const part = getPartForChorist(choristId, group);
    if (!part) return Infinity;
    return group.parts.findIndex((p) => p.id === part.id);
  }

  function getCurrentParts(choristId: string): Record<string, string> {
    const parts: Record<string, string> = {};
    for (const group of voiceGroups) {
      const part = getPartForChorist(choristId, group);
      parts[group.id] = part?.id ?? "";
    }
    return parts;
  }

  function isFilterActive(groupId: string, partId: string): boolean {
    return filters.some((f) => f.groupId === groupId && f.partId === partId);
  }

  function toggleFilter(group: VoiceGroup, part: VoicePart) {
    if (isFilterActive(group.id, part.id)) {
      setFilters(filters.filter((f) => !(f.groupId === group.id && f.partId === part.id)));
    } else {
      setFilters([...filters, {
        groupId: group.id,
        groupName: group.name,
        partId: part.id,
        partName: part.name,
      }]);
    }
  }

  function removeFilter(groupId: string, partId: string) {
    setFilters(filters.filter((f) => !(f.groupId === groupId && f.partId === partId)));
  }

  function clearFilters() {
    setFilters([]);
  }

  function matchesFilters(choristId: string): boolean {
    if (filters.length === 0) return true;
    const byGroup = new Map<string, string[]>();
    for (const f of filters) {
      const parts = byGroup.get(f.groupId) || [];
      parts.push(f.partId);
      byGroup.set(f.groupId, parts);
    }
    for (const [groupId, partIds] of byGroup) {
      const group = voiceGroups.find((g) => g.id === groupId);
      if (!group) return false;
      const choristPart = getPartForChorist(choristId, group);
      if (!choristPart || !partIds.includes(choristPart.id)) return false;
    }
    return true;
  }

  const standardGroups = sortVoiceGroups(voiceGroups.filter((g) => g.isStandard));

  const fourPartGroup = standardGroups.find(
    (g) =>
      g.name.includes("4-part") ||
      g.name.includes("4-stäm") ||
      g.name === "4-part",
  );
  const otherStandardGroups = standardGroups.filter((g) => g.id !== fourPartGroup?.id);

  const filteredChorists = chorists
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => matchesFilters(c.id))
    .sort((a, b) => {
      for (const group of standardGroups) {
        const aIdx = getPartSortIndex(a.id, group);
        const bIdx = getPartSortIndex(b.id, group);
        if (aIdx !== bIdx) return aIdx - bIdx;
      }
      return a.name.localeCompare(b.name);
    });

  const sortedFilterGroups = sortVoiceGroups(voiceGroups);

  function handleDownloadCsv() {
    const csvColumns = [
      ...(fourPartGroup ? [fourPartGroup.name] : []),
      "Name",
      "Section Leader",
      ...otherStandardGroups.map((g) => g.name),
    ];
    const header = csvColumns.join(",");
    const rows = filteredChorists.map((c) => {
      const cells: string[] = [];
      if (fourPartGroup) {
        cells.push(getPartForChorist(c.id, fourPartGroup)?.name ?? "");
      }
      cells.push(c.name.includes(",") ? `"${c.name}"` : c.name);
      cells.push(c.isSectionLeader ? "Yes" : "No");
      for (const g of otherStandardGroups) {
        cells.push(getPartForChorist(c.id, g)?.name ?? "");
      }
      return cells.join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chorists.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    loading,
    search,
    setSearch,
    modal,
    setModal,
    filters,
    filterMenuOpen,
    setFilterMenuOpen,
    filterExpandedGroup,
    setFilterExpandedGroup,
    filterRef,
    archivedOpen,
    setArchivedOpen,
    archivedChorists,
    voiceGroups,
    standardGroups,
    fourPartGroup,
    otherStandardGroups,
    filteredChorists,
    sortedFilterGroups,
    getPartForChorist,
    getCurrentParts,
    isFilterActive,
    toggleFilter,
    removeFilter,
    clearFilters,
    openArchivedModal,
    handleUnarchive,
    handleDownloadCsv,
    loadData,
  };
}
