const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const Table = require('cli-table3');
const readline = require('readline');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// API/Keys Declaration
const API_KEY_1 = process.env.API_KEY_1
const API_KEY_2 = process.env.API_KEY_2
const API_KEY = API_KEY_2
const scraperAPI = process.env.SCRAPER_API_URL
const telegramAPI = process.env.TELEGRAM_BOT_API
const groupChatID = process.env.GROUP_CHAT_ID

// Constant Declaration for Web Bot
const targetURL = "https://www.ipaddress.my";
// const finalURL = `${scraperAPI}?api_key=${API_KEY}&url=${targetURL}`;
const finalURL = 'https://ticketmaster.sg/activity/detail/24_taylorswift';
// const finalURL = 'https://google.com';

// Telegram Bot Declaration
const telegram = new TelegramBot(telegramAPI, { polling: true });

// Interval and Target Element Constants
const targetElement = '.an-bk';
let OPEN_TAB_ID;
let EVAL_ELEM_ID;
const OPEN_TAB_INTERVAL = 5000; // 5 seconds
const EVAL_ELEM_INTERVAL = 1000; // 1 seconds
var tabSuccessful = false;

  async function monitorElementStatus() {

  // 1. to open in chrome instead of chromium, remember to run ./url.sh
  const incognito_browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser/e1c7852f-69c7-40dd-9813-87481d91f053'
  });
  const browser = await incognito_browser.createIncognitoBrowserContext();
  const mainPage = await browser.newPage();

  // // 2. to open regularly
  // const browser = await puppeteer.launch({ headless: false });\
  // const mainPage = await browser.newPage();
  
  // // 3. to open in incognito mode
  // const incognito_browser = await puppeteer.launch({ headless: false });
  // const browser = await incognito_browser.createIncognitoBrowserContext();
  // const mainPage = await browser.newPage();

  // keeping track of all open tabs
  const openTabs = [{ page: mainPage, title: 'Main Tab' }];
  // keeping track of all texts
  let previousTexts = Array(openTabs.length).fill('');

  const table = createTable();

  await mainPage.goto(finalURL);

  // method to initialize looping function calls every TIME_INTERVAL
  async function init() {
    OPEN_TAB_ID = setInterval(openTab, OPEN_TAB_INTERVAL)
    EVAL_ELEM_ID = setInterval(evaluateElement, EVAL_ELEM_INTERVAL)
  }

  // main method 1 : opens a new tab + keeps reference to it via openTabs
  async function openTab() {
    var tabsOpened = openTabs.length + 1
    const newPage = await browser.newPage();
    const customTitle = `Tab ${tabsOpened}`;
    openTabs.push({ page: newPage, title: customTitle });

    await newPage.goto(finalURL);
    await newPage.evaluate((customTitle) => {
      document.title = customTitle;
    }, customTitle);

    console.log("Number of tabs opened: " + tabsOpened) 
  }

  // main method 2 : evaluates all elements using ::evaluateElementStatus
  async function evaluateElement() {
    const elementStatuses = await Promise.all(
      openTabs.map((tab, index) => evaluateElementStatus(tab, index))
    );

    // optimal solution: only adds elements that have changed to table + only print when such element present
    elementStatuses.forEach((status, index) => {
      if (status.status) {
        tabSuccessful = true
        const { title } = openTabs[index];
        addToTable(title, status.status, status.text);
      }
    });
    if (tabSuccessful) console.log(table.toString());

    // // sub-optimal solution, prints everything during every scan
    // clearTable()
    // elementStatuses.forEach((status, index) => {
    //   const { title } = openTabs[index];
    //   addToTable(title, status.status, status.text);
    // });
    // console.log(table.toString());
  }
  
  async function evaluateElementStatus(tab, tabIndex) {
    try {
      const page = tab.page;
      const timeout = 1000; 

      // produces an error if element doesn't exist
      const element = await page.waitForSelector(targetElement, { timeout });
      // obtains text within targetElement
      const elementText = await page.evaluate((el) => el.innerText, element);
      // checks if text in element is changed
      const status = (elementText === previousTexts[tabIndex])
        ? false 
        : (previousTexts[tabIndex] === '' || previousTexts[tabIndex] === undefined)
            ? false 
            : true
      previousTexts[tabIndex] = elementText;

      return { status, text: elementText };

    } catch (error) {
        return { status: 'Error', text: 'Error evaluating element status' };
    }
  }

  function createTable() {
    return new Table({
      head: ['Tab Title', 'Changed?', 'Element Text'],
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
    clearInterval(OPEN_TAB_ID);
    clearInterval(EVAL_ELEM_ID);
    console.log('Script stopped.');
  });

  init()
}

monitorElementStatus();
