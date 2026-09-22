"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  listChorists,
  listVoiceGroups,
  getAssignments,
} from "../../lib/api";
import ChoristModal from "../../components/ChoristModal";
import { Table, Thead, TheadRow, Th, Tbody, Tr, Td } from "../../components/StyledTable";

type Chorist = {
  id: string;
  name: string;
  isSectionLeader: boolean;
  isArchived: boolean;
};

type VoicePart = { id: string; name: string; color: string; shape: string };
type VoiceGroup = { id: string; name: string; isStandard: boolean; parts: VoicePart[] };
type Assignment = { choristId: string; voicePartId: string };

type ModalState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; chorist: Chorist };

// A filter is a selected voice part within a voice group
type ActiveFilter = { groupId: string; groupName: string; partId: string; partName: string };

export default function RosterPage() {
  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [voiceGroups, setVoiceGroups] = useState<VoiceGroup[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>(
    {},
  );
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterExpandedGroup, setFilterExpandedGroup] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [showArchived]);

  // Close filter menu on outside click
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
      listChorists(showArchived),
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
  }

  function getPartForChorist(
    choristId: string,
    group: VoiceGroup,
  ): VoicePart | null {
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

  function matchesFilters(choristId: string): boolean {
    if (filters.length === 0) return true;
    // Group filters by voice group — within a group, any match counts (OR).
    // Across groups, all must match (AND).
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

  const standardGroups = voiceGroups
    .filter((g) => g.isStandard)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

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

  const sortedFilterGroups = [...voiceGroups].sort((a, b) => {
    const aIs4 = a.name.includes("4-part") || a.name.includes("4-stäm");
    const bIs4 = b.name.includes("4-part") || b.name.includes("4-stäm");
    if (aIs4 !== bIs4) return aIs4 ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

  return (
    <div className="flex flex-col min-h-screen py-8 px-8">
      <Link
        href="/"
        className="self-start text-sm text-blue-500 hover:underline mb-4"
      >
        &larr; Home
      </Link>
      <h1 className="text-4xl font-bold mb-6">Roster</h1>

      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="border border-gray-300 rounded px-3 py-2 text-sm w-64"
            />
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => {
                  setFilterMenuOpen(!filterMenuOpen);
                  setFilterExpandedGroup(null);
                }}
                className="px-2 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                title="Filter"
              >
                ≡
              </button>
              {filterMenuOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-56">
                  {sortedFilterGroups.map((group) => (
                    <div key={group.id}>
                      <button
                        onClick={() =>
                          setFilterExpandedGroup(
                            filterExpandedGroup === group.id ? null : group.id,
                          )
                        }
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span>{group.name}</span>
                        <span className="text-gray-400 text-xs">
                          {filterExpandedGroup === group.id ? "▼" : "▶"}
                        </span>
                      </button>
                      {filterExpandedGroup === group.id && (
                        <div className="pl-3 pb-1">
                          {group.parts.map((part) => (
                            <label
                              key={part.id}
                              className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isFilterActive(group.id, part.id)}
                                onChange={() => toggleFilter(group, part)}
                              />
                              {part.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <label className="flex items-center gap-1 text-sm text-gray-500 ml-2">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Show archived
            </label>
          </div>
          <button
            onClick={() => setModal({ mode: "add" })}
            className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium"
          >
            + Add chorist
          </button>
        </div>

        {filters.length > 0 && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {filters.map((f) => (
              <span
                key={`${f.groupId}-${f.partId}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
              >
                {f.groupName}: {f.partName}
                <button
                  onClick={() => removeFilter(f.groupId, f.partId)}
                  className="hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={() => setFilters([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
        )}

        <Table>
          <Thead>
            <TheadRow>
              {fourPartGroup && <Th compact />}
              <Th>Name</Th>
              {otherStandardGroups.map((g) => (
                <Th key={g.id}>{g.name}</Th>
              ))}
              <Th compact />
            </TheadRow>
          </Thead>
          <Tbody>
            {filteredChorists.map((chorist) => {
              const fourPartPart = fourPartGroup
                ? getPartForChorist(chorist.id, fourPartGroup)
                : null;

              return (
                <Tr
                  key={chorist.id}
                  className={chorist.isArchived ? "opacity-50" : ""}
                >
                  {fourPartGroup && (
                    <Td compact>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">
                          {fourPartPart?.name ?? "—"}
                        </span>
                        {chorist.isSectionLeader && (
                          <span title="Section leader">⭐</span>
                        )}
                      </div>
                    </Td>
                  )}
                  <Td className="font-medium">{chorist.name}</Td>
                  {otherStandardGroups.map((group) => {
                    const part = getPartForChorist(chorist.id, group);
                    return (
                      <Td key={group.id} className="text-gray-600">
                        {part?.name ?? "—"}
                      </Td>
                    );
                  })}
                  <Td compact className="text-center">
                    <button
                      onClick={() => setModal({ mode: "edit", chorist })}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit chorist"
                    >
                      ✏️
                    </button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>

        {filteredChorists.length === 0 && (
          <p className="text-gray-400 text-sm mt-4 text-center">
            {search ? "No chorists match your search." : "No chorists yet."}
          </p>
        )}
      </div>

      {modal.mode !== "closed" && (
        <ChoristModal
          mode={modal.mode}
          chorist={modal.mode === "edit" ? modal.chorist : undefined}
          voiceGroups={voiceGroups}
          currentParts={
            modal.mode === "edit" ? getCurrentParts(modal.chorist.id) : {}
          }
          onClose={() => setModal({ mode: "closed" })}
          onSaved={() => {
            setModal({ mode: "closed" });
            loadData();
          }}
        />
      )}
    </div>
  );
}
