const pptxgen = require('pptxgenjs');
const pres = new pptxgen();

pres.layout = 'LAYOUT_16x9';
pres.title = 'Mutual Aid Pool — Synthesis Hackathon 2026';
pres.author = 'Mutual Aid Pool Team';
pres.subject = 'Hackathon Pitch Deck';

const theme = {
  primary: "0a0a0a",
  secondary: "0070F3",
  accent: "D4AF37",
  light: "f5f5f5",
  bg: "ffffff"
};

const slideCount = 12;

for (let i = 1; i <= slideCount; i++) {
  const num = String(i).padStart(2, '0');
  const slideModule = require(`./slide-${num}.js`);
  slideModule.createSlide(pres, theme);
}

pres.writeFile({ fileName: './output/presentation.pptx' })
  .then(() => console.log('Created: ./output/presentation.pptx'))
  .catch(err => { console.error('Error:', err); process.exit(1); });