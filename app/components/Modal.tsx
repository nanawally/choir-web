import type { ReactNode } from "react";

export default function Modal({
  onClose,
  children,
  className = "",
  scrollable = false,
}: {
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}) {
  return (
    <div
      className={`fixed inset-0 bg-overlay flex items-center justify-center z-50${scrollable ? " overflow-y-auto p-4" : ""}`}
      onClick={onClose}
    >
      <div
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
