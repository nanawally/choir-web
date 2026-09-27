"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type Props = {
  url: string;
  width?: number;
  onClick?: () => void;
};

export default function PdfPreview({ url, width = 400, onClick }: Props) {
  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer"
      onClick={onClick}
      title="Click to open full PDF"
    >
      <Document
        file={url}
        loading={
          <div className="h-48 flex items-center justify-center text-sm text-gray-400">
            Loading...
          </div>
        }
      >
        <Page pageNumber={1} width={width} />
      </Document>
    </div>
  );
}
