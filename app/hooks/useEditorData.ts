import { useEffect, useState } from "react";
import { apiFetch, getAssignments, listVoiceGroups } from "../lib/api";
import { sortChoristsByVoicePart } from "../lib/voiceGroupSort";
import type { Assignment, Chorist, VoiceGroup } from "../lib/editorTypes";

export function useEditorData() {
  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [voiceGroups, setVoiceGroups] = useState<VoiceGroup[]>([]);
  const [fourPartAssignments, setFourPartAssignments] = useState<Assignment[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [highlightPartId, setHighlightPartId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/chorists").then((res) => res.json()).then(setChorists);
  }, []);

  useEffect(() => {
    listVoiceGroups().then(setVoiceGroups);
  }, []);

  useEffect(() => {
    const fourPart = voiceGroups.find(
      (g) => g.name.includes("4-part") || g.name.includes("4-stäm"),
    );
    if (fourPart) getAssignments(fourPart.id).then(setFourPartAssignments);
  }, [voiceGroups]);

  useEffect(() => {
    if (activeGroupId) getAssignments(activeGroupId).then(setAssignments);
  }, [activeGroupId]);

  function handleSelectGroup(groupId: string | null) {
    setActiveGroupId(groupId);
    setHighlightPartId(null);
    if (!groupId) setAssignments([]);
  }

  const fourPartGroup = voiceGroups.find(
    (g) => g.name.includes("4-part") || g.name.includes("4-stäm"),
  );
  const sortedChorists = sortChoristsByVoicePart(chorists, fourPartGroup, fourPartAssignments);

  return {
    chorists,
    voiceGroups,
    setVoiceGroups,
    fourPartAssignments,
    sortedChorists,
    activeGroupId,
    assignments,
    highlightPartId,
    setHighlightPartId,
    handleSelectGroup,
  };
}
