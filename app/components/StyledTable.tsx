"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

type StyledTableProps = {
  children: React.ReactNode;
  className?: string;
};

export function Table({ children, className = "" }: StyledTableProps) {
  return (
    <table
      className={`w-full border-collapse text-sm border border-border rounded ${className}`}
    >
      {children}
    </table>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function TheadRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-border">{children}</tr>;
}

type ThProps = {
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
  style?: React.CSSProperties;
  sortDir?: "asc" | "desc" | null;
  onSort?: () => void;
};

export function Th({
  children,
  className = "",
  compact,
  style,
  sortDir,
  onSort,
}: ThProps) {
  return (
    <th
      className={`py-2 px-3 font-semibold border-r border-border last:border-r-0 ${compact ? "w-0 whitespace-nowrap" : "text-left"} ${onSort ? "cursor-pointer select-none" : ""} ${className}`}
      style={style}
      onClick={onSort}
    >
      <span className="flex items-center gap-1">
        {children}
        {onSort && (
          <span className="text-subtle text-xs">
            {sortDir === "asc" ? (
              <ChevronUp size={14} />
            ) : sortDir === "desc" ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronsUpDown size={14} />
            )}
          </span>
        )}
      </span>
    </th>
  );
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

type TrProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export function Tr({ children, onClick, className = "" }: TrProps) {
  return (
    <tr
      className={`group border-b border-border hover:bg-hover-bg ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

type TdProps = {
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function Td({ children, className = "", compact }: TdProps) {
  return (
    <td
      className={`py-2 px-3 border-r border-border last:border-r-0 ${compact ? "w-0 whitespace-nowrap" : ""} ${className}`}
    >
      {children}
    </td>
  );
}
