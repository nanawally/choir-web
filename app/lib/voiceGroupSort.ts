type VoiceGroupLike = { name: string; isStandard?: boolean; parts?: { id: string }[] };

function is4Part(name: string): boolean {
  return name.includes("4-part") || name.includes("4-stäm");
}

type ChoristLike = { id: string; firstName: string; lastName: string };
type AssignmentLike = { choristId: string; voicePartId: string };

/**
 * Sort chorists by 4-part voice assignment (S1, S2, A1, A2…) then first name.
 * Unassigned chorists sort last.
 */
export function sortChoristsByVoicePart<T extends ChoristLike>(
  chorists: T[],
  fourPartGroup: { parts: { id: string }[] } | undefined | null,
  assignments: AssignmentLike[],
): T[] {
  return [...chorists].sort((a, b) => {
    if (fourPartGroup) {
      const aAssign = assignments.find((x) => x.choristId === a.id);
      const bAssign = assignments.find((x) => x.choristId === b.id);
      const aIdx = aAssign
        ? fourPartGroup.parts.findIndex((p) => p.id === aAssign.voicePartId)
        : Infinity;
      const bIdx = bAssign
        ? fourPartGroup.parts.findIndex((p) => p.id === bAssign.voicePartId)
        : Infinity;
      if (aIdx !== bIdx) return aIdx - bIdx;
    }
    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
  });
}

/**
 * Sort voice groups: 4-part first, then standard groups numerically,
 * then non-standard numerically/alphabetically.
 */
export function sortVoiceGroups<T extends VoiceGroupLike>(groups: T[]): T[] {
  return [...groups].sort((a, b) => {
    const a4 = is4Part(a.name);
    const b4 = is4Part(b.name);
    if (a4 !== b4) return a4 ? -1 : 1;

    const aStd = a.isStandard ?? true;
    const bStd = b.isStandard ?? true;
    if (aStd !== bStd) return aStd ? -1 : 1;

    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}
