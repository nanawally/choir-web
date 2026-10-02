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
};

export default function PdfViewer({ url }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [numPages, setNumPages] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className="h-48 flex items-center justify-center text-sm text-subtle">
            {t("common.loading")}
          </div>
        }
      >
        {width &&
          Array.from({ length: numPages }, (_, i) => (
            <div key={i} className={i > 0 ? "mt-2" : ""}>
              <Page pageNumber={i + 1} width={width} />
            </div>
          ))}
      </Document>
    </div>
  );
}
