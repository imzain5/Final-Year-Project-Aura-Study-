import jsPDF from "jspdf";

// Color palette - dark futuristic theme
const COLORS = {
  bgDark: [12, 14, 24] as [number, number, number],
  bgCard: [18, 22, 38] as [number, number, number],
  bgAccent: [24, 28, 48] as [number, number, number],
  primary: [80, 140, 255] as [number, number, number],
  primaryDim: [50, 90, 180] as [number, number, number],
  secondary: [140, 80, 255] as [number, number, number],
  accent: [0, 220, 180] as [number, number, number],
  textBright: [230, 235, 255] as [number, number, number],
  textMuted: [140, 150, 180] as [number, number, number],
  textDim: [80, 90, 120] as [number, number, number],
  gridLine: [30, 35, 55] as [number, number, number],
  divider: [40, 50, 80] as [number, number, number],
  summaryBg: [20, 30, 55] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const drawBackground = (doc: jsPDF, pageWidth: number, pageHeight: number) => {
  // Solid dark background
  doc.setFillColor(...COLORS.bgDark);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Subtle dot grid pattern
  doc.setFillColor(...COLORS.gridLine);
  for (let x = 20; x < pageWidth - 10; x += 12) {
    for (let yy = 20; yy < pageHeight - 10; yy += 12) {
      doc.circle(x, yy, 0.2, "F");
    }
  }

  // Top-left corner accent geometry
  doc.setDrawColor(...COLORS.primaryDim);
  doc.setLineWidth(0.3);
  doc.line(0, 8, 35, 8);
  doc.line(8, 0, 8, 35);
  doc.setDrawColor(...COLORS.secondary);
  doc.line(0, 12, 20, 12);
  doc.line(12, 0, 12, 20);

  // Bottom-right corner accent
  doc.setDrawColor(...COLORS.primaryDim);
  doc.line(pageWidth, pageHeight - 8, pageWidth - 35, pageHeight - 8);
  doc.line(pageWidth - 8, pageHeight, pageWidth - 8, pageHeight - 35);
};

const drawHexagonIcon = (doc: jsPDF, cx: number, cy: number, r: number, color: [number, number, number]) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  for (let i = 0; i < 6; i++) {
    doc.line(pts[i][0], pts[i][1], pts[(i + 1) % 6][0], pts[(i + 1) % 6][1]);
  }
};

const drawSectionAccent = (doc: jsPDF, x: number, y: number, w: number) => {
  // Glowing line with endpoints
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.4);
  doc.line(x, y, x + w, y);
  doc.setFillColor(...COLORS.primary);
  doc.circle(x, y, 1, "F");
  doc.circle(x + w, y, 0.6, "F");
};

export const generateNotePdf = (note: {
  title: string;
  subject?: string;
  summary?: string;
  content?: string;
  created_at?: string;
}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 22;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;
  let sectionNum = 0;

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 20) {
      doc.addPage();
      drawBackground(doc, pageWidth, pageHeight);
      y = 22;
    }
  };

  // === PAGE 1 BACKGROUND ===
  drawBackground(doc, pageWidth, pageHeight);

  // === HEADER BANNER ===
  // Gradient-style banner (simulated with layered rects)
  const bannerH = 52;
  doc.setFillColor(...COLORS.bgCard);
  doc.roundedRect(margin - 2, y - 2, maxWidth + 4, bannerH, 3, 3, "F");

  // Inner glow border
  doc.setDrawColor(...COLORS.primaryDim);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin - 2, y - 2, maxWidth + 4, bannerH, 3, 3, "S");

  // Hexagon decorations
  drawHexagonIcon(doc, pageWidth - margin - 8, y + 10, 6, COLORS.primaryDim);
  drawHexagonIcon(doc, pageWidth - margin - 20, y + 6, 4, COLORS.secondary);

  // "BRAINGRID" label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.primary);
  doc.text("BRAINGRID  //  NEURAL DOCUMENT SYSTEM", margin + 4, y + 6);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.textBright);
  const titleLines = doc.splitTextToSize(note.title.toUpperCase(), maxWidth - 40);
  doc.text(titleLines, margin + 4, y + 18);

  // Meta row
  const metaY = y + bannerH - 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textDim);
  const metaParts: string[] = [];
  if (note.subject) metaParts.push(`SUBJECT: ${note.subject.toUpperCase()}`);
  if (note.created_at) metaParts.push(`DATE: ${new Date(note.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }).toUpperCase()}`);
  if (note.content) {
    const wc = note.content.split(/\s+/).filter(Boolean).length;
    metaParts.push(`${wc} WORDS`);
    metaParts.push(`~${Math.max(1, Math.ceil(wc / 200))} MIN READ`);
  }
  doc.text(metaParts.join("   |   "), margin + 4, metaY);

  // Subject badge
  if (note.subject) {
    const badgeX = pageWidth - margin - 2;
    doc.setFillColor(...COLORS.primary);
    const badgeW = doc.getTextWidth(note.subject.toUpperCase()) + 8;
    doc.roundedRect(badgeX - badgeW, metaY - 4, badgeW, 6, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.bgDark);
    doc.text(note.subject.toUpperCase(), badgeX - badgeW + 4, metaY);
  }

  y += bannerH + 8;

  // === AI SUMMARY BLOCK ===
  if (note.summary) {
    addPageIfNeeded(30);

    const summaryLines = doc.splitTextToSize(note.summary, maxWidth - 20);
    const boxH = summaryLines.length * 4.5 + 18;

    // Background card
    doc.setFillColor(...COLORS.summaryBg);
    doc.roundedRect(margin, y, maxWidth, boxH, 2, 2, "F");

    // Left accent bar
    doc.setFillColor(...COLORS.accent);
    doc.rect(margin, y, 1.5, boxH, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.accent);
    doc.text("◆  AI NEURAL SUMMARY", margin + 6, y + 7);

    // Decorative circuit line
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.15);
    const lineEndX = margin + 6 + doc.getTextWidth("◆  AI NEURAL SUMMARY") + 4;
    doc.line(lineEndX, y + 5.5, lineEndX + 25, y + 5.5);
    doc.circle(lineEndX + 25, y + 5.5, 0.5, "S");

    // Summary text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textBright);
    doc.text(summaryLines, margin + 6, y + 14);

    y += boxH + 8;
  }

  // === CONTENT ===
  if (note.content) {
    const lines = note.content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
        sectionNum++;
        addPageIfNeeded(18);

        // Section number badge
        const numStr = String(sectionNum).padStart(2, "0");
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(margin, y - 1, 10, 7, 1.5, 1.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.bgDark);
        doc.text(numStr, margin + 3, y + 3.5);

        // Heading text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(...COLORS.textBright);
        const heading = trimmed.replace(/^#+\s*/, "");
        const wrapped = doc.splitTextToSize(heading, maxWidth - 16);
        doc.text(wrapped, margin + 14, y + 4);
        y += wrapped.length * 7 + 4;

        // Section divider
        drawSectionAccent(doc, margin, y, maxWidth);
        y += 5;

      } else if (trimmed.startsWith("## ")) {
        addPageIfNeeded(14);
        doc.setDrawColor(...COLORS.secondary);
        doc.setLineWidth(0.3);
        doc.line(margin, y + 1, margin + 4, y + 1);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...COLORS.primary);
        const heading = trimmed.replace(/^#+\s*/, "");
        const wrapped = doc.splitTextToSize(heading, maxWidth - 10);
        doc.text(wrapped, margin + 7, y + 3);
        y += wrapped.length * 6 + 5;

      } else if (trimmed.startsWith("### ")) {
        addPageIfNeeded(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.secondary);
        const heading = trimmed.replace(/^#+\s*/, "");
        const wrapped = doc.splitTextToSize(heading, maxWidth - 6);
        doc.text(wrapped, margin + 3, y + 2);
        y += wrapped.length * 5.5 + 4;

      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        addPageIfNeeded(8);
        const bulletText = trimmed.replace(/^[-*]\s*/, "");
        const clean = bulletText.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
        const wrapped = doc.splitTextToSize(clean, maxWidth - 14);

        // Bullet diamond
        doc.setFillColor(...COLORS.primary);
        doc.setDrawColor(...COLORS.primary);
        // Small diamond shape
        const bx = margin + 4, by = y + 1;
        doc.setLineWidth(0.3);
        doc.line(bx, by - 1, bx + 1, by);
        doc.line(bx + 1, by, bx, by + 1);
        doc.line(bx, by + 1, bx - 1, by);
        doc.line(bx - 1, by, bx, by - 1);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textBright);
        doc.text(wrapped, margin + 10, y + 2);
        y += wrapped.length * 4.5 + 2.5;

      } else if (/^\d+\.\s/.test(trimmed)) {
        addPageIfNeeded(8);
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const text = numMatch[2].replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
          const wrapped = doc.splitTextToSize(text, maxWidth - 14);

          // Number circle
          doc.setDrawColor(...COLORS.primary);
          doc.setLineWidth(0.3);
          doc.circle(margin + 4, y + 1, 2.5, "S");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(...COLORS.primary);
          doc.text(num, margin + 4, y + 2, { align: "center" });

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.textBright);
          doc.text(wrapped, margin + 10, y + 2);
          y += wrapped.length * 4.5 + 2.5;
        }

      } else if (trimmed === "") {
        y += 3;
      } else {
        addPageIfNeeded(8);
        const clean = trimmed.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
        const wrapped = doc.splitTextToSize(clean, maxWidth);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textMuted);
        doc.text(wrapped, margin, y + 2);
        y += wrapped.length * 4.5 + 2;
      }
    }
  }

  // === FOOTER on every page ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const fY = pageHeight - 10;

    // Footer line
    doc.setDrawColor(...COLORS.divider);
    doc.setLineWidth(0.2);
    doc.line(margin, fY - 4, pageWidth - margin, fY - 4);

    // BrainGrid branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.primaryDim);
    doc.text("BRAINGRID", margin, fY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textDim);
    doc.text("Neural Document System", margin + doc.getTextWidth("BRAINGRID") + 3, fY);

    // Page indicator
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.textDim);
    doc.text(`${String(i).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`, pageWidth - margin, fY, { align: "right" });

    // Classification badge
    doc.setFillColor(...COLORS.bgAccent);
    const classText = "CONFIDENTIAL";
    const classW = doc.getTextWidth(classText) + 6;
    doc.roundedRect(pageWidth / 2 - classW / 2, fY - 3.5, classW, 5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...COLORS.textDim);
    doc.text(classText, pageWidth / 2, fY, { align: "center" });
  }

  doc.save(`${note.title.replace(/[^a-zA-Z0-9]/g, "_")}_BrainGrid.pdf`);
};
