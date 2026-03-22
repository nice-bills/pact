import PptxGenJS from "pptxgenjs";

const theme = {
  primary: "0a0a0a",
  secondary: "0070F3",
  accent: "D4AF37",
  light: "f5f5f5",
  bg: "ffffff"
};

const slideConfig = {
  title: "Bounty Tracks — 20+ Qualified",
  type: "content",
  pageNumber: 10
};

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  const margin = 0.4;
  const contentW = 10 - margin * 2;

  slide.addText("Bounty Tracks — 20+ Qualified", {
    x: margin,
    y: 0.35,
    w: contentW,
    h: 0.45,
    fontSize: 26,
    fontFace: "Arial",
    bold: true,
    color: theme.primary
  });

  slide.addText("Open Track · Agentic Finance · ERC-8183 · GenLayer · Status Network · ENS + more", {
    x: margin,
    y: 0.8,
    w: contentW,
    h: 0.3,
    fontSize: 13,
    fontFace: "Arial",
    bold: false,
    color: theme.secondary
  });

  const columns = [
    {
      label: "Tracks",
      items: [
        "Open Track",
        "Best Agent on Celo",
        "Best Use of Delegation",
        "Agentic Finance",
        "Agent Services on Base"
      ]
    },
    {
      label: "Builder + DeFi",
      items: [
        "Let the Agent Cook (PL)",
        "Agents With Receipts (PL)",
        "Best Use of Locus",
        "ERC-8183 Open Build",
        "Best Use of Agentic Storage"
      ]
    },
    {
      label: "Ecosystem",
      items: [
        "Status Network",
        "ENS Identity",
        "ENS Communication",
        "Escrow Ecosystem Extensions",
        "Student Founder's Bet"
      ]
    }
  ];

  const colW = 2.9;
  const colGap = 0.25;
  const startX = margin;
  const startY = 1.35;

  columns.forEach((col, colIdx) => {
    const colX = startX + colIdx * (colW + colGap);

    slide.addShape(pres.ShapeType.rect, {
      x: colX,
      y: startY,
      w: colW,
      h: 0.35,
      fill: { color: theme.secondary },
      line: { color: theme.secondary }
    });

    slide.addText(col.label, {
      x: colX,
      y: startY,
      w: colW,
      h: 0.35,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: theme.bg,
      align: "center",
      valign: "middle"
    });

    col.items.forEach((item, itemIdx) => {
      const itemY = startY + 0.5 + itemIdx * 0.55;

      slide.addShape(pres.ShapeType.ellipse, {
        x: colX + 0.15,
        y: itemY + 0.12,
        w: 0.12,
        h: 0.12,
        fill: { color: theme.secondary },
        line: { color: theme.secondary }
      });

      slide.addText(item, {
        x: colX + 0.35,
        y: itemY,
        w: colW - 0.35,
        h: 0.4,
        fontSize: 13,
        fontFace: "Arial",
        bold: false,
        color: theme.primary,
        valign: "middle"
      });
    });
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3,
    y: 5.1,
    w: 0.4,
    h: 0.4,
    fill: { color: theme.secondary },
    line: { color: theme.secondary }
  });

  slide.addText("10", {
    x: 9.3,
    y: 5.1,
    w: 0.4,
    h: 0.4,
    fontSize: 11,
    fontFace: "Arial",
    bold: true,
    color: theme.bg,
    align: "center",
    valign: "middle"
  });

  return slide;
}

const preview = async () => {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  createSlide(pres);
  await pres.writeFile({ fileName: "slide-10-preview.pptx" });
  console.log("Created slide-10-preview.pptx");
};

if (import.meta.url === `file://${process.argv[1]}`) {
  preview().catch(console.error);
}

export { createSlide, slideConfig };
