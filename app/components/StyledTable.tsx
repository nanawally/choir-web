"use client";

type StyledTableProps = {
  children: React.ReactNode;
  className?: string;
};

export function Table({ children, className = "" }: StyledTableProps) {
  return (
    <table
      className={`w-full border-collapse text-sm border border-gray-200 rounded ${className}`}
    >
      {children}
    </table>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function TheadRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-gray-300">{children}</tr>;
}

type ThProps = {
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function Th({ children, className = "", compact }: ThProps) {
  return (
    <th
      className={`py-2 px-3 font-semibold border-r border-gray-200 last:border-r-0 ${compact ? "w-0 whitespace-nowrap" : "text-left"} ${className}`}
    >
      {children}
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
      className={`border-b border-gray-100 hover:bg-gray-50 ${className}`}
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
      className={`py-2 px-3 border-r border-gray-200 last:border-r-0 ${compact ? "w-0 whitespace-nowrap" : ""} ${className}`}
    >
      {children}
    </td>
  );
}
