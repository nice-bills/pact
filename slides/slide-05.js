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

  slide.addText("How It Works — Claim Lifecycle", {
    x: 0.4, y: 0.3, w: 9.2, h: 0.5,
    fontSize: 28, fontFace: "Arial", bold: true, color: theme.primary
  });

  const steps = [
    { num: "1", name: "Submit", desc: "Member submits claim with evidence to group chat" },
    { num: "2", name: "Deliberate", desc: "AI agents + humans discuss in public channel" },
    { num: "3", name: "Vote", desc: "Agents independently evaluate, post recommendations" },
    { num: "4", name: "Escrow", desc: "If approved, funds move from Safe → ERC-8183 escrow" },
    { num: "5", name: "Complete", desc: "Evaluator calls complete(), USDC released to claimant" }
  ];

  const startX = 0.6;
  const stepWidth = 1.8;
  const circleY = 2.2;
  const circleSize = 0.55;

  const lineY = circleY + circleSize / 2;
  slide.addShape(pres.ShapeType.rect, {
    x: startX + circleSize / 2,
    y: lineY - 0.02,
    w: (stepWidth * 4) + circleSize,
    h: 0.04,
    fill: { color: theme.light }
  });

  steps.forEach((step, i) => {
    const circleX = startX + i * stepWidth;

    slide.addShape(pres.ShapeType.ellipse, {
      x: circleX, y: circleY, w: circleSize, h: circleSize,
      fill: { color: i === 0 || i === 4 ? theme.accent : theme.secondary }
    });

    slide.addText(step.num, {
      x: circleX, y: circleY, w: circleSize, h: circleSize,
      fontSize: 18, fontFace: "Arial", bold: true, color: theme.bg,
      align: "center", valign: "center"
    });

    slide.addText(step.name, {
      x: circleX - 0.2, y: circleY + circleSize + 0.15, w: circleSize + 0.4, h: 0.35,
      fontSize: 14, fontFace: "Arial", bold: true, color: theme.primary,
      align: "center", valign: "top"
    });

    slide.addText(step.desc, {
      x: circleX - 0.4, y: circleY + circleSize + 0.5, w: circleSize + 0.8, h: 0.9,
      fontSize: 10, fontFace: "Arial", bold: false, color: theme.primary,
      align: "center", valign: "top"
    });
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3, y: 5.1, w: 0.35, h: 0.35,
    fill: { color: theme.secondary }
  });
  slide.addText("5", {
    x: 9.3, y: 5.1, w: 0.35, h: 0.35,
    fontSize: 12, fontFace: "Arial", bold: true, color: theme.bg,
    align: "center", valign: "center"
  });

  return slide;
}

export const slideConfig = {
  title: "How It Works — Claim Lifecycle",
  type: "content",
  theme
};

import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  createSlide(pres);
  pres.writeFile({ fileName: "/home/bills/dev/mutual-aid-pool/slides/slide-05-preview.pptx" })
    .then(() => console.log("Created slide-05-preview.pptx"))
    .catch(err => console.error(err));
}
