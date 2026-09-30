"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../lib/LanguageContext";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type Props = {
  url: string;
  onClick?: () => void;
};

export default function PdfPreview({ url, onClick }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="border border-border rounded-lg overflow-hidden cursor-pointer"
      onClick={onClick}
      title={t("common.clickToOpenPdf")}
    >
      <Document
        file={url}
        loading={
          <div className="h-48 flex items-center justify-center text-sm text-subtle">
            {t("common.loading")}
          </div>
        }
      >
        {width && <Page pageNumber={1} width={width} />}
      </Document>
    </div>
  );
}
