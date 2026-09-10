"use client";

type Chorist = { id: string; name: string };

type Props = {
  chorists: Chorist[];
  placedIds: Set<string>;
  onPlace: (id: string) => void;
  hiddenIds: Set<string>;
  onToggleHidden: (ids: Set<string>) => void;
};

export default function RosterPanel({
  chorists,
  placedIds,
  onPlace,
  hiddenIds,
  onToggleHidden,
}: Props) {

  const unplaced = chorists.filter((c) => !placedIds.has(c.id));
  const placed = chorists.filter((c) => placedIds.has(c.id));

  function toggleHidden(choristId: string) {
    const next = new Set(hiddenIds);
    if (next.has(choristId)) {
      next.delete(choristId);
    } else {
      next.add(choristId);
    }
    onToggleHidden(next);
  }

  return (
    <div className="p-4 overflow-y-auto">
      <h2 className="font-bold mb-3">Roster</h2>
          
          <h3 className="text-xs text-gray-500 font-medium mb-1">Unplaced</h3>
          <ul className="space-y-1 mb-4">
            {unplaced.map((c) => (
              <li key={c.id} className="text-sm py-0.5 px-2 rounded hover:bg-gray-100 cursor-pointer" onClick={() => onPlace(c.id)}>
                {c.name}
              </li>
            ))}
          </ul>

      {placed.length > 0 && (
        <>
          <h3 className="text-xs text-gray-500 font-medium mb-1">Placed</h3>
          <ul className="space-y-1 mb-4">
            {placed.map((c) => (
              <li key={c.id} className={`flex items-center text-sm py-0.5 px-2 rounded ${hiddenIds.has(c.id) ? "opacity-40" : ""}`}>
                <button
                  onClick={() => toggleHidden(c.id)}
                  className="mr-1 text-xs w-5"
                  title={hiddenIds.has(c.id) ? "Show on grid" : "Hide from grid"}
                >
                  {hiddenIds.has(c.id) ? "🚫" : "👁"}
                </button>
                <span className="flex-1 truncate">{c.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      
    </div>
  );
}
