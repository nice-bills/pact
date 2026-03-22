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

  slide.addText("Ecosystem Integrations", {
    x: 0.4, y: 0.3, w: 9.2, h: 0.5,
    fontSize: 28, fontFace: "Arial", bold: true, color: theme.primary
  });

  const integrations = [
    { name: "Safe Multisig", desc: "Holds pooled USDC, no single admin" },
    { name: "Lido stETH", desc: "Earns yield on idle capital" },
    { name: "Uniswap V3", desc: "Swap any token to USDC" },
    { name: "x402 Protocol", desc: "Pays AI agents for evaluation work" },
    { name: "MetaMask Delegation", desc: "Sign on behalf, gasless" },
    { name: "ERC-8004 Identity", desc: "On-chain identity per contributor" }
  ];

  const cardW = 2.9;
  const cardH = 1.4;
  const startX = 0.4;
  const startY = 1.0;
  const gapX = 0.15;
  const gapY = 0.15;

  integrations.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    slide.addShape(pres.ShapeType.rect, {
      x: x, y: y, w: cardW, h: cardH,
      fill: { color: theme.bg },
      line: { color: theme.light, width: 1 }
    });

    slide.addShape(pres.ShapeType.rect, {
      x: x, y: y, w: 0.05, h: cardH,
      fill: { color: theme.accent }
    });

    slide.addShape(pres.ShapeType.rect, {
      x: x, y: y, w: cardW, h: cardH,
      fill: { color: theme.light, transparency: 50 }
    });

    slide.addText(item.name, {
      x: x + 0.15, y: y + 0.2, w: cardW - 0.3, h: 0.4,
      fontSize: 14, fontFace: "Arial", bold: true, color: theme.primary
    });

    slide.addText(item.desc, {
      x: x + 0.15, y: y + 0.6, w: cardW - 0.3, h: 0.6,
      fontSize: 11, fontFace: "Arial", bold: false, color: theme.primary
    });
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3, y: 5.1, w: 0.35, h: 0.35,
    fill: { color: theme.secondary }
  });
  slide.addText("8", {
    x: 9.3, y: 5.1, w: 0.35, h: 0.35,
    fontSize: 12, fontFace: "Arial", bold: true, color: theme.bg,
    align: "center", valign: "center"
  });

  return slide;
}

export const slideConfig = {
  title: "Ecosystem Integrations",
  type: "content",
  theme
};

import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  createSlide(pres);
  pres.writeFile({ fileName: "/home/bills/dev/mutual-aid-pool/slides/slide-08-preview.pptx" })
    .then(() => console.log("Created slide-08-preview.pptx"))
    .catch(err => console.error(err));
}
