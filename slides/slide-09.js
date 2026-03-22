import PptxGenJS from "pptxgenjs";

const theme = {
  primary: "0a0a0a",
  secondary: "0070F3",
  accent: "D4AF37",
  light: "f5f5f5",
  bg: "ffffff"
};

const slideConfig = {
  title: "Live Demo — Claim Lifecycle on Base Sepolia",
  type: "content",
  pageNumber: 9
};

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  const margin = 0.4;
  const contentW = 10 - margin * 2;

  slide.addText("Live Demo — Claim Lifecycle on Base Sepolia", {
    x: margin,
    y: 0.35,
    w: contentW,
    h: 0.45,
    fontSize: 26,
    fontFace: "Arial",
    bold: true,
    color: theme.primary
  });

  slide.addText("6 transactions confirmed — Job #4 claim execution", {
    x: margin,
    y: 0.8,
    w: contentW,
    h: 0.3,
    fontSize: 14,
    fontFace: "Arial",
    bold: false,
    color: theme.secondary
  });

  const txData = [
    { label: "createJob", hash: "0x6d4c122f" },
    { label: "setBudget", hash: "0x93812bac" },
    { label: "approve", hash: "0xa38e75f0" },
    { label: "fund", hash: "0x6a584838" },
    { label: "submit", hash: "0x8f511239" },
    { label: "complete", hash: "0x1d08c692" }
  ];

  const leftX = margin;
  const startY = 1.35;
  const rowH = 0.55;

  txData.forEach((tx, i) => {
    const y = startY + i * rowH;

    slide.addText(tx.label, {
      x: leftX,
      y: y,
      w: 1.3,
      h: 0.4,
      fontSize: 14,
      fontFace: "Arial",
      bold: true,
      color: theme.primary,
      valign: "middle"
    });

    slide.addText("→", {
      x: leftX + 1.3,
      y: y,
      w: 0.35,
      h: 0.4,
      fontSize: 14,
      fontFace: "Arial",
      bold: false,
      color: theme.secondary,
      valign: "middle",
      align: "center"
    });

    slide.addText(`https://sepolia.basescan.org/tx/${tx.hash}...`, {
      x: leftX + 1.65,
      y: y,
      w: 3.5,
      h: 0.4,
      fontSize: 12,
      fontFace: "Arial",
      bold: false,
      color: theme.secondary,
      valign: "middle"
    });
  });

  const cardX = 6.0;
  const cardY = 1.35;
  const cardW = 3.4;
  const cardH = 3.3;

  slide.addShape(pres.ShapeType.roundRect, {
    x: cardX,
    y: cardY,
    w: cardW,
    h: cardH,
    fill: { color: theme.light },
    line: { color: theme.light },
    rectRadius: 0.08
  });

  slide.addText("$5", {
    x: cardX,
    y: cardY + 0.5,
    w: cardW,
    h: 1.2,
    fontSize: 72,
    fontFace: "Arial",
    bold: true,
    color: theme.accent,
    align: "center",
    valign: "middle"
  });

  slide.addText("claim successfully\nexecuted", {
    x: cardX,
    y: cardY + 1.7,
    w: cardW,
    h: 0.6,
    fontSize: 18,
    fontFace: "Arial",
    bold: false,
    color: theme.primary,
    align: "center",
    valign: "middle"
  });

  slide.addText("USDC moved from\nSafe → escrow → claimant", {
    x: cardX,
    y: cardY + 2.35,
    w: cardW,
    h: 0.7,
    fontSize: 12,
    fontFace: "Arial",
    bold: false,
    color: theme.primary,
    align: "center",
    valign: "top"
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3,
    y: 5.1,
    w: 0.4,
    h: 0.4,
    fill: { color: theme.secondary },
    line: { color: theme.secondary }
  });

  slide.addText("9", {
    x: 9.3,
    y: 5.1,
    w: 0.4,
    h: 0.4,
    fontSize: 12,
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
  await pres.writeFile({ fileName: "slide-09-preview.pptx" });
  console.log("Created slide-09-preview.pptx");
};

if (import.meta.url === `file://${process.argv[1]}`) {
  preview().catch(console.error);
}

export { createSlide, slideConfig };
