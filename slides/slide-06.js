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

  slide.addText("AI Agents — Evaluators, Not Overlords", {
    x: 0.4, y: 0.3, w: 9.2, h: 0.5,
    fontSize: 28, fontFace: "Arial", bold: true, color: theme.primary
  });

  slide.addText([
    { text: "Independent judgment", options: { bold: true, breakLine: true } },
    { text: "Each contributor's agent reads claims and forms its own recommendation. No centralized AI.", options: { bold: false, breakLine: true } },
    { text: "", options: { breakLine: true } },
    { text: "Public deliberation", options: { bold: true, breakLine: true } },
    { text: "Agents post evaluations in the group chat. Full transparency. Anyone can read the reasoning.", options: { bold: false, breakLine: true } },
    { text: "", options: { breakLine: true } },
    { text: "No single point of failure", options: { bold: true, breakLine: true } },
    { text: "One agent going rogue can't hijack the outcome. Humans still sign or delegate via MetaMask.", options: { bold: false } }
  ], {
    x: 0.4, y: 1.0, w: 4.5, h: 4.0,
    fontSize: 14, fontFace: "Arial", color: theme.primary,
    paraSpaceAfter: 6
  });

  const agentCenterX = 7.0;
  const agentCenterY = 2.8;
  const agentRadius = 0.9;

  const angles = [210, 330, 90];
  const agentPositions = angles.map(angle => {
    const rad = angle * Math.PI / 180;
    return {
      x: agentCenterX + Math.cos(rad) * agentRadius,
      y: agentCenterY + Math.sin(rad) * agentRadius
    };
  });

  agentPositions.forEach((pos, i) => {
    const colors = [theme.secondary, theme.accent, theme.secondary];
    slide.addShape(pres.ShapeType.ellipse, {
      x: pos.x - 0.3, y: pos.y - 0.3, w: 0.6, h: 0.6,
      fill: { color: colors[i] }
    });
    slide.addText(`Agent ${i + 1}`, {
      x: pos.x - 0.3, y: pos.y - 0.3, w: 0.6, h: 0.6,
      fontSize: 8, fontFace: "Arial", bold: true, color: theme.bg,
      align: "center", valign: "center"
    });
  });

  slide.addShape(pres.ShapeType.downArrow, {
    x: agentCenterX - 0.25, y: agentCenterY - 0.15, w: 0.5, h: 0.5,
    fill: { color: theme.primary }
  });
  slide.addText("Outcome", {
    x: agentCenterX - 0.4, y: agentCenterY + 0.35, w: 0.8, h: 0.3,
    fontSize: 9, fontFace: "Arial", bold: true, color: theme.primary,
    align: "center"
  });

  slide.addShape(pres.ShapeType.rect, {
    x: agentCenterX - 0.5, y: agentCenterY - 0.5, w: 1.0, h: 1.0,
    fill: { color: theme.light },
    line: { color: theme.accent, width: 2 }
  });
  slide.addText("Shield", {
    x: agentCenterX - 0.5, y: agentCenterY - 0.5, w: 1.0, h: 1.0,
    fontSize: 10, fontFace: "Arial", bold: true, color: theme.accent,
    align: "center", valign: "center"
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3, y: 5.1, w: 0.35, h: 0.35,
    fill: { color: theme.secondary }
  });
  slide.addText("6", {
    x: 9.3, y: 5.1, w: 0.35, h: 0.35,
    fontSize: 12, fontFace: "Arial", bold: true, color: theme.bg,
    align: "center", valign: "center"
  });

  return slide;
}

export const slideConfig = {
  title: "AI Agents — Evaluators, Not Overlords",
  type: "content",
  theme
};

import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  createSlide(pres);
  pres.writeFile({ fileName: "/home/bills/dev/mutual-aid-pool/slides/slide-06-preview.pptx" })
    .then(() => console.log("Created slide-06-preview.pptx"))
    .catch(err => console.error(err));
}
