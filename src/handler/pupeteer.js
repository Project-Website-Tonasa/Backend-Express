// const puppeteer = require('puppeteer');
// const fs = require('fs-extra');
// const path = require('path');
// const hbs = require('handlebars');
// const laps = require('../../resources/laps.json');

// const compile = async (data) => {
//   const filehtml = path.join(process.cwd(), 'resources\\', 'formGeneratePDF.hbs');
//   const file = await fs.readFile(filehtml, 'utf8');

//   return hbs.compile(file)(data);
// };

// const test = async (req, res) => {
//   try {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     const content = await compile(laps);
//     await page.setContent(content);

//     await page.pdf({
//       path: 'output.pdf',
//       format: 'A4',
//       printBackground: true,
//     });

//     console.log('success');
//     // process.exit();

//     await browser.close();
//   } catch (e) {
//     console.log('ini', e);
//   }
// };

// module.exports = {
//   test,
// };
