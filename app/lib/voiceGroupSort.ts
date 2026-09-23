type VoiceGroupLike = { name: string; isStandard?: boolean };

function is4Part(name: string): boolean {
  return name.includes("4-part") || name.includes("4-stäm");
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
