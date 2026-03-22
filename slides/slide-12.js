import PptxGenJS from "pptxgenjs";

const theme = {
  primary: "0a0a0a",
  secondary: "0070F3",
  accent: "D4AF37",
  light: "f5f5f5",
  bg: "ffffff"
};

const slideConfig = {
  title: "Build Trust On-Chain",
  type: "summary",
  pageNumber: 12
};

function createSlide(pres) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  const margin = 0.4;
  const contentW = 10 - margin * 2;

  slide.addText("Build Trust On-Chain", {
    x: margin,
    y: 0.35,
    w: contentW,
    h: 0.6,
    fontSize: 44,
    fontFace: "Arial",
    bold: true,
    color: theme.primary,
    align: "center"
  });

  slide.addText("Mutual Aid Pool — where communities govern emergency funds together", {
    x: margin,
    y: 0.95,
    w: contentW,
    h: 0.35,
    fontSize: 14,
    fontFace: "Arial",
    bold: false,
    color: theme.secondary,
    align: "center"
  });

  const takeaways = [
    {
      num: "1",
      title: "Human + AI co-governance",
      desc: "No single admin. Collective decision-making in public."
    },
    {
      num: "2",
      title: "On-chain transparency",
      desc: "Every transaction verifiable. Escrow can't be Rugged."
    },
    {
      num: "3",
      title: "Multi-chain deployment",
      desc: "Live on Avalanche, Celo, Base, Status Network, GenLayer."
    }
  ];

  const cardW = 2.9;
  const cardH = 1.5;
  const cardGap = 0.25;
  const cardStartX = margin + 0.15;
  const cardY = 1.6;

  takeaways.forEach((item, idx) => {
    const cardX = cardStartX + idx * (cardW + cardGap);

    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX,
      y: cardY,
      w: cardW,
      h: cardH,
      fill: { color: theme.light },
      line: { color: theme.light },
      rectRadius: 0.08
    });

    slide.addShape(pres.ShapeType.ellipse, {
      x: cardX + 0.15,
      y: cardY + 0.15,
      w: 0.35,
      h: 0.35,
      fill: { color: theme.accent },
      line: { color: theme.accent }
    });

    slide.addText(item.num, {
      x: cardX + 0.15,
      y: cardY + 0.15,
      w: 0.35,
      h: 0.35,
      fontSize: 14,
      fontFace: "Arial",
      bold: true,
      color: theme.bg,
      align: "center",
      valign: "middle"
    });

    slide.addText(item.title, {
      x: cardX + 0.6,
      y: cardY + 0.15,
      w: cardW - 0.75,
      h: 0.35,
      fontSize: 13,
      fontFace: "Arial",
      bold: true,
      color: theme.primary,
      valign: "middle"
    });

    slide.addText(item.desc, {
      x: cardX + 0.15,
      y: cardY + 0.6,
      w: cardW - 0.3,
      h: 0.8,
      fontSize: 11,
      fontFace: "Arial",
      bold: false,
      color: theme.primary,
      valign: "top"
    });
  });

  const ctaY = 3.45;
  const ctaW = 4.2;
  const ctaH = 0.55;
  const ctaX = (10 - ctaW) / 2;

  slide.addShape(pres.ShapeType.roundRect, {
    x: ctaX,
    y: ctaY,
    w: ctaW,
    h: ctaH,
    fill: { color: theme.secondary },
    line: { color: theme.secondary },
    rectRadius: 0.12
  });

  slide.addText("git@github.com:nice-bills/pact.git", {
    x: ctaX,
    y: ctaY,
    w: ctaW,
    h: ctaH,
    fontSize: 14,
    fontFace: "Arial",
    bold: false,
    color: theme.bg,
    align: "center",
    valign: "middle"
  });

  slide.addShape(pres.ShapeType.ellipse, {
    x: 9.3,
    y: 5.1,
    w: 0.4,
    h: 0.4,
    fill: { color: theme.secondary },
    line: { color: theme.secondary }
  });

  slide.addText("12", {
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
  await pres.writeFile({ fileName: "slide-12-preview.pptx" });
  console.log("Created slide-12-preview.pptx");
};

if (import.meta.url === `file://${process.argv[1]}`) {
  preview().catch(console.error);
}

export { createSlide, slideConfig };
