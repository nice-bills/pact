import PptxGenJS from "pptxgenjs";

const theme = {
  primary: "0a0a0a",
  secondary: "0070F3",
  accent: "D4AF37",
  light: "f5f5f5",
  bg: "ffffff"
};

export function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("Multi-Chain Deployment", {
    x: 0.4, y: 0.3, w: 9.2, h: 0.5,
    fontSize: 28, fontFace: "Arial", bold: true, color: theme.primary
  });

  slide.addText("Live on 5 networks — verified on-chain", {
    x: 0.4, y: 0.75, w: 9.2, h: 0.3,
    fontSize: 14, fontFace: "Arial", bold: false, color: theme.primary
  });

  const tableData = [
    [
      { text: "Chain", options: { fill: { color: theme.secondary }, color: theme.bg, bold: true, align: "center" } },
      { text: "Network", options: { fill: { color: theme.secondary }, color: theme.bg, bold: true, align: "center" } },
      { text: "Contract", options: { fill: { color: theme.secondary }, color: theme.bg, bold: true, align: "center" } },
      { text: "Status", options: { fill: { color: theme.secondary }, color: theme.bg, bold: true, align: "center" } }
    ],
    [
      { text: "Avalanche", options: { fill: { color: theme.bg }, color: theme.primary, bold: true, align: "left" } },
      { text: "Fuji", options: { fill: { color: theme.bg }, color: theme.primary, bold: false, align: "center" } },
      { text: "0x77107B62a9149...", options: { fill: { color: theme.bg }, color: theme.primary, bold: false, align: "left", fontFace: "Arial" } },
      { text: "✅ Verified", options: { fill: { color: theme.bg }, color: theme.accent, bold: false, align: "center" } }
    ],
    [
      { text: "Celo", options: { fill: { color: theme.light }, color: theme.primary, bold: true, align: "left" } },
      { text: "Sepolia", options: { fill: { color: theme.light }, color: theme.primary, bold: false, align: "center" } },
      { text: "0x77107B62a9149...", options: { fill: { color: theme.light }, color: theme.primary, bold: false, align: "left", fontFace: "Arial" } },
      { text: "✅ Verified", options: { fill: { color: theme.light }, color: theme.accent, bold: false, align: "center" } }
    ],
    [
      { text: "Base", options: { fill: { color: theme.bg }, color: theme.primary, bold: true, align: "left" } },
      { text: "Sepolia", options: { fill: { color: theme.bg }, color: theme.primary, bold: false, align: "center" } },
      { text: "0x76Dd9C55D9a2...", options: { fill: { color: theme.bg }, color: theme.primary, bold: false, align: "left", fontFace: "Arial" } },
      { text: "✅ Verified", options: { fill: { color: theme.bg }, color: theme.accent, bold: false, align: "center" } }
    ],
    [
      { text: "Status Network", options: { fill: { color: theme.light }, color: theme.primary, bold: true, align: "left" } },
      { text: "Sepolia", options: { fill: { color: theme.light }, color: theme.primary, bold: false, align: "center" } },
      { text: "0x3f4D1B212514...", options: { fill: { color: theme.light }, color: theme.primary, bold: false, align: "left", fontFace: "Arial" } },
      { text: "✅ Verified", options: { fill: { color: theme.light }, color: theme.accent, bold: false, align: "center" } }
    ],
    [
      { text: "GenLayer", options: { fill: { color: theme.bg }, color: theme.primary, bold: true, align: "left" } },
      { text: "Bradbury", options: { fill: { color: theme.bg }, color: theme.primary, bold: false, align: "center" } },
      { text: "0xd94B673433b4...", options: { fill: { color: theme.bg }, color: theme.primary, bold: false, align: "left", fontFace: "Arial" } },
      { text: "✅ Finalized", options: { fill: { color: theme.bg }, color: theme.accent, bold: false, align: "center" } }
    ]
  ];

  slide.addTable(tableData, {
    x: 0.4, y: 1.2, w: 9.2,
    colW: [2.0, 1.5, 3.5, 2.2],
    rowH: 0.5,
    fontFace: "Arial",
    fontSize: 12,
    border: { pt: 0.5, color: theme.light }
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3, y: 5.1, w: 0.35, h: 0.35,
    fill: { color: theme.secondary }
  });
  slide.addText("7", {
    x: 9.3, y: 5.1, w: 0.35, h: 0.35,
    fontSize: 12, fontFace: "Arial", bold: true, color: theme.bg,
    align: "center", valign: "center"
  });

  return slide;
}

export const slideConfig = {
  title: "Multi-Chain Deployment",
  type: "content",
  theme
};

import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  createSlide(pres);
  pres.writeFile({ fileName: "/home/bills/dev/mutual-aid-pool/slides/slide-07-preview.pptx" })
    .then(() => console.log("Created slide-07-preview.pptx"))
    .catch(err => console.error(err));
}
