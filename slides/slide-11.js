import PptxGenJS from "pptxgenjs";

const theme = {
  primary: "0a0a0a",
  secondary: "0070F3",
  accent: "D4AF37",
  light: "f5f5f5",
  bg: "ffffff"
};

const slideConfig = {
  title: "Tech Stack",
  type: "content",
  pageNumber: 11
};

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  const margin = 0.4;
  const contentW = 10 - margin * 2;

  slide.addText("Tech Stack", {
    x: margin,
    y: 0.35,
    w: contentW,
    h: 0.45,
    fontSize: 26,
    fontFace: "Arial",
    bold: true,
    color: theme.primary
  });

  const columns = [
    {
      header: "Protocols & Networks",
      items: [
        "Solidity + Hardhat + Foundry",
        "TypeScript + Node.js",
        "Safe SDK (counterfactual on testnets)",
        "ERC-8183 Escrow",
        "Multi-chain RPC via config"
      ]
    },
    {
      header: "AI & Agents",
      items: [
        "AI agent with 27+ tools",
        "GenLayer intelligent contract",
        "Status Network agent registry",
        "x402 payment protocol",
        "MetaMask Delegation (ERC-7715)"
      ]
    }
  ];

  const colW = 4.4;
  const colGap = 0.4;
  const startX = margin;
  const startY = 1.1;
  const headerH = 0.4;
  const itemStartY = startY + headerH + 0.2;

  columns.forEach((col, colIdx) => {
    const colX = startX + colIdx * (colW + colGap);

    slide.addShape(pres.ShapeType.rect, {
      x: colX,
      y: startY,
      w: colW,
      h: headerH,
      fill: { color: theme.secondary },
      line: { color: theme.secondary }
    });

    slide.addText(col.header, {
      x: colX,
      y: startY,
      w: colW,
      h: headerH,
      fontSize: 14,
      fontFace: "Arial",
      bold: true,
      color: theme.bg,
      align: "center",
      valign: "middle"
    });

    col.items.forEach((item, itemIdx) => {
      const itemY = itemStartY + itemIdx * 0.55;

      slide.addShape(pres.ShapeType.ellipse, {
        x: colX + 0.2,
        y: itemY + 0.14,
        w: 0.1,
        h: 0.1,
        fill: { color: theme.secondary },
        line: { color: theme.secondary }
      });

      slide.addText(item, {
        x: colX + 0.4,
        y: itemY,
        w: colW - 0.4,
        h: 0.45,
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

  slide.addText("11", {
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
  await pres.writeFile({ fileName: "slide-11-preview.pptx" });
  console.log("Created slide-11-preview.pptx");
};

if (import.meta.url === `file://${process.argv[1]}`) {
  preview().catch(console.error);
}

export { createSlide, slideConfig };
