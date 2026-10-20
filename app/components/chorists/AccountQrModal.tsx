"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "../../lib/LanguageContext";

type Props = {
  username: string;
  setupToken: string;
  onClose: () => void;
};

export default function AccountQrModal({ username, setupToken, onClose }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const setupUrl = `${window.location.origin}/setup?token=${setupToken}`;

  function handleCopy() {
    navigator.clipboard.writeText(setupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 bg-overlay flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg shadow-lg p-6 w-[calc(100%-2rem)] max-w-sm flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{t("qrModal.title")}</h2>
        <p className="text-sm text-muted text-center">{t("qrModal.instruction")}</p>

        <QRCodeSVG value={setupUrl} size={200} />

        <p className="text-sm">
          <span className="text-muted">{t("qrModal.username")}</span>{" "}
          <span className="font-mono font-medium">{username}</span>
        </p>

        <code className="text-xs text-muted break-all text-center">{setupUrl}</code>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 px-3 py-2 text-sm btn-primary"
          >
            {copied ? t("qrModal.copied") : t("qrModal.copy")}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm border border-border rounded hover:bg-hover-bg"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
