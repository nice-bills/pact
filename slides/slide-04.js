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
  title: "The Solution"
};

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("The Solution", {
    x: 0.4,
    y: 0.3,
    w: 9.2,
    h: 0.6,
    fontFace: "Arial",
    fontSize: 36,
    bold: true,
    color: theme.primary
  });

  slide.addText("Mutual Aid Pool — where humans and AI agents co-govern a shared emergency fund", {
    x: 0.4,
    y: 0.9,
    w: 9.2,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 14,
    bold: false,
    color: theme.secondary,
    italic: true
  });

  const cards = [
    {
      headerColor: theme.secondary,
      title: "Pool Capital",
      desc: "Contributors deposit USDC. Earn yield via Lido stETH. Transparent on-chain balance."
    },
    {
      headerColor: theme.accent,
      title: "AI Evaluators",
      desc: "Each contributor runs an AI agent. Agents read the claim, evaluate fairly, post recommendations publicly."
    },
    {
      headerColor: theme.secondary,
      title: "ERC-8183 Escrow",
      desc: "Funds locked in smart contract escrow. No admin can rug. Evaluator calls complete() to pay."
    }
  ];

  const cardWidth = 2.9;
  const cardGap = 0.25;
  const startX = 0.4;
  const cardY = 1.5;
  const cardHeight = 3.4;
  const headerHeight = 0.12;
  const radius = 0.08;

  cards.forEach((card, i) => {
    const cardX = startX + i * (cardWidth + cardGap);

    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX,
      y: cardY,
      w: cardWidth,
      h: cardHeight,
      fill: { color: theme.light },
      rectRadius: radius
    });

    slide.addShape(pres.ShapeType.rect, {
      x: cardX,
      y: cardY,
      w: cardWidth,
      h: headerHeight,
      fill: { color: card.headerColor }
    });

    slide.addText(card.title, {
      x: cardX,
      y: cardY + 0.25,
      w: cardWidth,
      h: 0.5,
      fontFace: "Arial",
      fontSize: 18,
      bold: true,
      color: theme.primary,
      align: "center"
    });

    slide.addText(card.desc, {
      x: cardX + 0.15,
      y: cardY + 0.85,
      w: cardWidth - 0.3,
      h: 2.3,
      fontFace: "Arial",
      fontSize: 14,
      bold: false,
      color: theme.primary,
      align: "center",
      valign: "top"
    });
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3,
    y: 5.1,
    w: 0.35,
    h: 0.35,
    fill: { color: theme.secondary }
  });

  slide.addText("4", {
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
  pres.writeFile({ fileName: path.join(__dirname, "slide-04-preview.pptx") })
    .then(() => console.log("Created slide-04-preview.pptx"))
    .catch(err => console.error(err));
}

export { createSlide, slideConfig };
