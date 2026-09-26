type Chorist = { id: string; firstName: string; lastName: string };

export function shortName(chorist: Chorist, allChorists: Chorist[]): string {
  const sameFirst = allChorists.filter(
    (c) => c.firstName === chorist.firstName && c.id !== chorist.id,
  );
  if (sameFirst.length === 0) return chorist.firstName;

  const lastInitial = chorist.lastName[0];
  if (!lastInitial) return chorist.firstName;

  const sameFirstAndInitial = sameFirst.filter(
    (c) => c.lastName[0] === lastInitial,
  );
  if (sameFirstAndInitial.length === 0) return `${chorist.firstName} ${lastInitial}.`;

  const twoChars = chorist.lastName.slice(0, 2);
  return `${chorist.firstName} ${twoChars}.`;
}
