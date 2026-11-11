"use client";

import { useState } from "react";
import { useTranslation } from "../lib/LanguageContext";

type Step = "ask" | "confirmBoth" | "confirmOnly" | "confirmNoLinked";

type Props = {
  /** The question for step 1: "Also delete [linked entity]?" */
  askMessage: string;
  /** Confirmation message when deleting both */
  confirmBothMessage: string;
  /** Confirmation message when deleting only the primary entity */
  confirmOnlyMessage: string;
  /** Confirmation message when there is no linked entity */
  confirmNoLinkedMessage: string;
  /** Whether a linked entity exists */
  hasLinked: boolean;
  /** Called with true (delete both) or false (delete primary only) */
  onConfirm: (alsoDeleteLinked: boolean) => void;
  onCancel: () => void;
};

export default function DeleteLinkedModal({
  askMessage,
  confirmBothMessage,
  confirmOnlyMessage,
  confirmNoLinkedMessage,
  hasLinked,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(hasLinked ? "ask" : "confirmNoLinked");

  if (step === "ask") {
    return (
      <div className="fixed inset-0 bg-overlay flex items-center justify-center z-[60]">
        <div className="bg-surface rounded-lg shadow-lg p-6 max-w-sm w-[calc(100%-2rem)]" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm mb-4">{askMessage}</p>
          <div className="flex gap-2 justify-end">
            <button onClick={onCancel} className="px-3 py-2 text-sm text-muted hover:text-foreground">{t("common.cancel")}</button>
            <button onClick={() => setStep("confirmOnly")} className="px-3 py-2 text-sm border border-border rounded hover:bg-hover-bg">{t("common.no")}</button>
            <button onClick={() => setStep("confirmBoth")} className="px-3 py-2 text-sm btn-danger">{t("common.yes")}</button>
          </div>
        </div>
      </div>
    );
  }

  const msg = step === "confirmBoth"
    ? confirmBothMessage
    : step === "confirmOnly"
      ? confirmOnlyMessage
      : confirmNoLinkedMessage;

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-[60]">
      <div className="bg-surface rounded-lg shadow-lg p-6 max-w-sm w-[calc(100%-2rem)]" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm mb-4">{msg}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-2 text-sm text-muted hover:text-foreground">{t("common.cancel")}</button>
          <button onClick={() => onConfirm(step === "confirmBoth")} className="px-3 py-2 text-sm btn-danger">{t("common.delete")}</button>
        </div>
      </div>
    </div>
  );
}
