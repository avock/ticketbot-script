const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const Table = require('cli-table3');
const readline = require('readline');
require('dotenv').config();

async function monitorElementStatus() {
  const API_KEY_1 = process.env.API_KEY_1
  const API_KEY_2 = process.env.API_KEY_2
  const API_KEY = API_KEY_2
  const scraperAPI = process.env.SCRAPER_API_URL
  
  const targetURL = "https://www.ipaddress.my";
  // const finalURL = `${scraperAPI}?api_key=${API_KEY}&url=${targetURL}`;
  // const finalURL = 'https://ticketmaster.sg/activity/detail/24_taylorswift';
  const finalURL = 'https://google.com';

  const elementSelector = '.an-bk';
  const OPEN_TAB_INTERVAL = 5000; // 5 seconds
  const EVAL_ELEM_INTERVAL = 1000; // 1 seconds
  
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

  // keeping track of all open tabs
  const openTabs = [{ page: mainPage, title: 'Main Tab' }];

  let previousTexts = Array(openTabs.length).fill('');

  const table = createTable();

  await mainPage.goto(finalURL);

  // method to initialize looping function calls every TIME_INTERVAL
  async function init() {
    setInterval(openTab, OPEN_TAB_INTERVAL)
    setInterval(evaluateElement, EVAL_ELEM_INTERVAL)
  }

  // main method 1 : opens a new tab + keeps reference to it via openTabs
  async function openTab() {
    const newPage = await browser.newPage();
    const customTitle = `Tab ${openTabs.length + 1}`;
    openTabs.push({ page: newPage, title: customTitle });

    await newPage.goto(finalURL);
    await newPage.evaluate((customTitle) => {
      document.title = customTitle;
    }, customTitle);
  }

  // main method 2 : evaluates all elements using ::evaluateElementStatus
  async function evaluateElement() {
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
  
  async function evaluateElementStatus(tab, tabIndex) {
    try {
      const page = tab.page;
      const timeout = 3000; // Timeout in milliseconds
  
      const element = await page.waitForSelector(elementSelector, { timeout });
      if (!element) {
        // Element not present, move on
        return { status: 'Not Present', text: '' };
      }
  
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

  init()
}

monitorElementStatus();
