const puppeteer = require('puppeteer');
const path = require('path');

async function makePDF(htmlFile, outputFile) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const filePath = path.resolve(__dirname, 'public/resumes', htmlFile);
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: path.resolve(__dirname, 'public/resumes', outputFile),
    format: 'Letter',
    margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    printBackground: true,
  });
  await browser.close();
  console.log(`Created ${outputFile}`);
}

(async () => {
  await makePDF('faang-drone.html', 'bradley-worthington-iii-resume.pdf');
  await makePDF('cool-builder.html', 'margot-spark-delacroix-resume.pdf');
})();
