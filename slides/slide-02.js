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
  type: "toc",
  title: "Agenda"
};

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("Agenda", {
    x: 0.4,
    y: 0.4,
    w: 9.2,
    h: 0.7,
    fontFace: "Arial",
    fontSize: 36,
    bold: true,
    color: theme.primary
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.4,
    y: 1.05,
    w: 1.2,
    h: 0.04,
    fill: { color: theme.accent }
  });

  const sections = [
    { num: "1", title: "The Problem", desc: "Community emergency funds are broken" },
    { num: "2", title: "The Solution", desc: "Pool + AI agents + on-chain escrow" },
    { num: "3", title: "How It Works", desc: "Claim lifecycle walkthrough" },
    { num: "4", title: "Demo + Integrations", desc: "Live on 5 chains" }
  ];

  let yPos = 1.5;
  sections.forEach((section) => {
    slide.addText(section.num, {
      x: 0.4,
      y: yPos,
      w: 0.6,
      h: 0.6,
      fontFace: "Arial",
      fontSize: 28,
      bold: true,
      color: theme.accent,
      valign: "middle"
    });

    slide.addText(section.title, {
      x: 1.1,
      y: yPos,
      w: 3.5,
      h: 0.35,
      fontFace: "Arial",
      fontSize: 20,
      bold: true,
      color: theme.primary,
      valign: "middle"
    });

    slide.addText(section.desc, {
      x: 1.1,
      y: yPos + 0.35,
      w: 7,
      h: 0.3,
      fontFace: "Arial",
      fontSize: 14,
      bold: false,
      color: theme.primary,
      valign: "top"
    });

    yPos += 0.9;
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3,
    y: 5.1,
    w: 0.35,
    h: 0.35,
    fill: { color: theme.secondary }
  });

  slide.addText("2", {
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
  pres.writeFile({ fileName: path.join(__dirname, "slide-02-preview.pptx") })
    .then(() => console.log("Created slide-02-preview.pptx"))
    .catch(err => console.error(err));
}

export { createSlide, slideConfig };
