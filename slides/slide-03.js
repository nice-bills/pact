import PptxGenJS from "pptxgenjs";
import { fileURLToPath } from "url";
import path from "path";

const theme = {
  primary: "0a0a0a",
  secondary: "0070F3",
  accent: "D4AF37",
  light: "f5f5f5",
  bg: "ffffff"
};

const slideConfig = {
  type: "content",
  title: "The Problem"
};

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.08,
    h: 5.625,
    fill: { color: theme.accent }
  });

  slide.addText("The Problem", {
    x: 0.4,
    y: 0.4,
    w: 9.2,
    h: 0.7,
    fontFace: "Arial",
    fontSize: 36,
    bold: true,
    color: theme.primary
  });

  const bullets = [
    { title: "Centralized control", desc: "Single admins decide who deserves help. Power asymmetry." },
    { title: "Slow manual review", desc: "Humans deliberate in silos. No accountability. Delays hurt applicants." },
    { title: "Fragmented trust", desc: "Donors can't verify their money helped real people. No on-chain proof." }
  ];

  let yPos = 1.4;
  bullets.forEach((bullet) => {
    slide.addShape(pres.ShapeType.ellipse, {
      x: 0.5,
      y: yPos + 0.12,
      w: 0.18,
      h: 0.18,
      fill: { color: theme.accent }
    });

    slide.addText(bullet.title, {
      x: 0.85,
      y: yPos,
      w: 8.5,
      h: 0.4,
      fontFace: "Arial",
      fontSize: 18,
      bold: true,
      color: theme.primary,
      valign: "middle"
    });

    slide.addText(bullet.desc, {
      x: 0.85,
      y: yPos + 0.45,
      w: 8.5,
      h: 0.5,
      fontFace: "Arial",
      fontSize: 16,
      bold: false,
      color: theme.primary,
      valign: "top"
    });

    yPos += 1.2;
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3,
    y: 5.1,
    w: 0.35,
    h: 0.35,
    fill: { color: theme.secondary }
  });

  slide.addText("3", {
    x: 9.3,
    y: 5.1,
    w: 0.35,
    h: 0.35,
    fontFace: "Arial",
    fontSize: 12,
    bold: true,
    color: theme.bg,
    align: "center",
    valign: "middle"
  });

  return slide;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.defineLayout({ name: "CUSTOM", width: 10, height: 5.625 });
  pres.layout = "CUSTOM";
  createSlide(pres);
  pres.writeFile({ fileName: path.join(__dirname, "slide-03-preview.pptx") })
    .then(() => console.log("Created slide-03-preview.pptx"))
    .catch(err => console.error(err));
}

export { createSlide, slideConfig };
