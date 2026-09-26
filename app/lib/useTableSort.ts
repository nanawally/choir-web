import { useState, useMemo } from "react";

type SortDir = "asc" | "desc" | null;

export function useTableSort<T>(
  data: T[],
  defaultSort: (a: T, b: T) => number,
) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  function cycleSort(key: keyof T) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }

  const sorted = useMemo(() => {
    const result = [...data];
    if (sortKey && sortDir) {
      result.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        let cmp: number;
        if (typeof av === "number" && typeof bv === "number") {
          cmp = av - bv;
        } else {
          cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        }
        return sortDir === "desc" ? -cmp : cmp;
      });
    } else {
      result.sort(defaultSort);
    }
    return result;
  }, [data, sortKey, sortDir, defaultSort]);

  return { sorted, sortKey, sortDir, cycleSort };
}
