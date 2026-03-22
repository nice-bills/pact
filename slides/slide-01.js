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
  type: "cover",
  title: "Mutual Aid Pool"
};

function createSlide(pres) {
  const slide = pres.addSlide();

  slide.background = { color: theme.bg };

  slide.addText("Mutual Aid Pool", {
    x: 0.4,
    y: 1.8,
    w: 9.2,
    h: 1.2,
    fontFace: "Arial",
    fontSize: 54,
    bold: true,
    color: theme.primary,
    align: "center"
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 3.5,
    y: 3.05,
    w: 3,
    h: 0.06,
    fill: { color: theme.secondary }
  });

  slide.addText("Community Emergency Fund — Humans & AI Agents Together", {
    x: 0.4,
    y: 3.3,
    w: 9.2,
    h: 0.6,
    fontFace: "Arial",
    fontSize: 22,
    bold: false,
    color: theme.primary,
    align: "center"
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.4,
    y: 4.9,
    w: 9.2,
    h: 0.5,
    fill: { color: theme.accent, transparency: 15 }
  });

  slide.addText("Synthesis Hackathon 2026", {
    x: 0.4,
    y: 4.95,
    w: 4.6,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 14,
    bold: true,
    color: theme.primary,
    align: "center"
  });

  slide.addText("March 22, 2026", {
    x: 5,
    y: 4.95,
    w: 4.6,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 14,
    bold: true,
    color: theme.primary,
    align: "center"
  });

  slide.addText("Powered by Safe Multisig + ERC-8183 Escrow", {
    x: 0.4,
    y: 4.3,
    w: 9.2,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 16,
    bold: false,
    color: theme.secondary,
    align: "center",
    italic: true
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
  pres.writeFile({ fileName: path.join(__dirname, "slide-01-preview.pptx") })
    .then(() => console.log("Created slide-01-preview.pptx"))
    .catch(err => console.error(err));
}

export { createSlide, slideConfig };
