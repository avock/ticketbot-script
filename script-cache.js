const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const Table = require('cli-table3');
const readline = require('readline');
require('dotenv').config();

async function monitorElementStatus() {
  const targetURL = "https://www.ipaddress.my";
  const API_KEY = process.env.API_KEY;
  const scraperAPI = "http://api.scraperapi.com";

  // const finalURL = `${scraperAPI}?api_key=${API_KEY}&url=${targetURL}`;
  const finalURL = 'https://ticketmaster.sg/activity/detail/24_taylorswift';

  const elementSelector = '.an-bk';
  const delayBetweenTabs = 5000; // 5 seconds
  
  // // 1. to open in chrome isntead of chromium, remember to run ./url.sh
  // const browser = await puppeteer.connect({
  //   browserWSEndpoint: 'ws://localhost:9222/devtools/browser/afc5dc21-366b-40d0-87d2-9da0c797a3c1'
  // });
  // const mainPage = await browser.newPage();
  
  // // 2. to open regularly
  // const browser = await puppeteer.launch({ headless: false });\
  // const mainPage = await browser.newPage();
  
  // 3. to open in incognito mode
  const incognito_browser = await puppeteer.launch({ headless: false });
  const browser = await incognito_browser.createIncognitoBrowserContext();
  const mainPage = await browser.newPage();

  const openTabs = [{ page: mainPage, title: 'Main Tab' }];

  let previousTexts = Array(openTabs.length).fill('');

  const table = createTable();

  await mainPage.goto(finalURL);

  async function evaluateElementStatus(tab, tabIndex) {
    try {
      const page = tab.page;
      // note: current implementation only works when elementSelector is present, else will keep waiting
      await page.waitForSelector(elementSelector);
      const element = await page.$(elementSelector);
      const elementText = await page.evaluate((el) => el.innerText, element);

      const status = elementText === previousTexts[tabIndex] ? 'Unchanged' : 'Changed';

      previousTexts[tabIndex] = elementText;

      return { status, text: elementText };
    } catch (error) {
      return { status: 'Error', text: 'Error evaluating element status' };
    }
  }

  function createTable() {
    return new Table({
      head: ['Tab Title', 'Status', 'Element Text'],
      colWidths: [20, 20, 40],
    });
  }

  function clearTable() {
    table.splice(0);
  }

  function addToTable(title, status, text) {
    const row = [title, status, text];
    table.push(row);
  }

  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  input.question('Press any key and Enter to stop the script...\n', async () => {
    input.close();
    await browser.close();
    process.exit(0);
  });

  while (true) {
    const newPage = await browser.newPage();
    const customTitle = `Tab ${openTabs.length + 1}`;
    openTabs.push({ page: newPage, title: customTitle });

    await newPage.goto(finalURL);
    await newPage.waitForTimeout(delayBetweenTabs);
    await newPage.evaluate((customTitle) => {
      document.title = customTitle;
    }, customTitle);

    const elementStatuses = await Promise.all(
      openTabs.map((tab, index) => evaluateElementStatus(tab, index))
    );

    clearTable();

    elementStatuses.forEach((status, index) => {
      if (status.status === 'Changed') {
        const { title } = openTabs[index];
        addToTable(title, status.status, status.text);
      }
    });

    console.log(table.toString());
  }
}

monitorElementStatus();
