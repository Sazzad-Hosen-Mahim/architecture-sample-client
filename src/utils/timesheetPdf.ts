import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Renders a timesheet DOM node to a landscape A4 PDF.
 *
 * Elements marked `.no-pdf` / `[data-html2canvas-ignore]` are hidden for the
 * capture, and scroll-clipped containers are temporarily expanded so the whole
 * timesheet is captured rather than just the visible slice.
 */
export async function downloadTimesheetPDF(elementId: string, fileName: string) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Timesheet content not found");

  const hidden = element.querySelectorAll<HTMLElement>(
    ".no-pdf, [data-html2canvas-ignore]"
  );
  hidden.forEach((el) => {
    el.style.display = "none";
  });

  const scrollable = element.querySelectorAll<HTMLElement>(
    '[class*="overflow"], [class*="max-h"]'
  );
  const originalStyles: {
    el: HTMLElement;
    overflow: string;
    maxHeight: string;
    height: string;
  }[] = [];
  scrollable.forEach((el) => {
    originalStyles.push({
      el,
      overflow: el.style.overflow,
      maxHeight: el.style.maxHeight,
      height: el.style.height,
    });
    el.style.overflow = "visible";
    el.style.maxHeight = "none";
    el.style.height = "auto";
  });

  try {
    // html-to-image uses SVG foreignObject — the browser handles oklab()
    // natively, so no CSS colour parse errors.
    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((res) => {
      img.onload = res;
    });

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const scaledHeight = img.height * (pdfWidth / img.width);

    let position = 0;
    let remainingHeight = scaledHeight;

    while (remainingHeight > 0) {
      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        position === 0 ? 0 : -(scaledHeight - remainingHeight),
        pdfWidth,
        scaledHeight
      );
      remainingHeight -= pdfHeight;
      if (remainingHeight > 0) pdf.addPage();
      position++;
    }

    pdf.save(fileName);
  } finally {
    hidden.forEach((el) => {
      el.style.display = "";
    });
    originalStyles.forEach(({ el, overflow, maxHeight, height }) => {
      el.style.overflow = overflow;
      el.style.maxHeight = maxHeight;
      el.style.height = height;
    });
  }
}

export function timesheetFileName(timecard: any) {
  const weekEnd = timecard?.weekEnding
    ? new Date(timecard.weekEnding).toLocaleDateString("en-CA")
    : new Date().toISOString().split("T")[0];
  const name = timecard?.user?.name?.replace(/\s+/g, "-") || "Timecard";
  return `Timecard-${name}-${weekEnd}.pdf`;
}
