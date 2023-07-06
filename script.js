const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const Table = require('cli-table3');
const readline = require('readline');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// API/Keys Declaration
const BROWSER_ENDPOINT = process.argv[2]
const API_KEY_1 = process.env.API_KEY_1
const API_KEY_2 = process.env.API_KEY_2
const API_KEY = API_KEY_2
const scraperAPI = process.env.SCRAPER_API_URL
const telegramAPI = process.env.TELEGRAM_BOT_API
const groupChatID = process.env.GROUP_CHAT_ID

// Constant Declaration for Web Bot
const targetURL = "https://www.ipaddress.my";
// const initialURL = `${scraperAPI}?api_key=${API_KEY}&url=${targetURL}`;
const taytayURL = 'https://google.com'
const initialURL = 'https://ticketmaster.sg/login';
const finalURL = 'https://click.mailing.ticketmaster.com/?qs=2d32134119df64f25e745e413bfa5c0d7adb93969de6de7c11f82ff431185145ea34971a579f8e42bd8a57691121379a8f9a5576413829b491030b11f2a019f5';

// Telegram Bot Declaration
const telegram = new TelegramBot(telegramAPI, { polling: true });

// Interval and Target Element Constants
const targetElement = '.an-bk';
let OPEN_TAB_ID;
const OPEN_TAB_INTERVAL = 3000; // 5 seconds
const EVAL_ELEM_INTERVAL = 10000; // 1 seconds
var isPaused = false;
var tabSuccessful = false;

  async function monitorElementStatus() {

  // 1. to open in chrome instead of chromium, remember to run ./url.sh
  const incognito_browser = await puppeteer.connect({
    browserWSEndpoint: BROWSER_ENDPOINT
  });
  const browser = await incognito_browser.createIncognitoBrowserContext();
  const mainPage = await browser.newPage();

  // // 2. to open regularly
  // const browser = await puppeteer.launch({ headless: false });
  // const mainPage = await browser.newPage();
  // await mainPage.setViewport({ width: 1920, height: 1080 });
  
  // // 3. to open in incognito mode
  // const incognito_browser = await puppeteer.launch({ headless: false });
  // const browser = await incognito_browser.createIncognitoBrowserContext();
  // const mainPage = await browser.newPage();

  // keeping track of all open tabs
  const openTabs = [{ page: mainPage, title: 'Main Tab' }];

  await mainPage.goto(taytayURL);

  // method to initialize looping function calls every TIME_INTERVAL
  async function init() {
    OPEN_TAB_ID = setInterval(openTab, OPEN_TAB_INTERVAL)
  }

  // main method 1 : opens a new tab + keeps reference to it via openTabs
  async function openTab() {
    try {
      var tabsOpened = openTabs.length + 1;
      const newPage = await browser.newPage();
      const customTitle = `Tab ${tabsOpened}`;
      openTabs.push({ page: newPage, title: customTitle });
  
      await newPage.goto(initialURL);
  
      const signInFormUsernameExists = await newPage.$('#signInFormUsername');
      const signInFormPasswordExists = await newPage.$('#signInFormPassword');
  
      if (signInFormUsernameExists && signInFormPasswordExists) {
        await newPage.waitForSelector('#signInFormUsername');
        await newPage.type('#signInFormUsername', 'ooijessie@hotmail.com');
  
        await newPage.waitForSelector('#signInFormPassword');
        await newPage.type('#signInFormPassword', 'Battleground.1');
      }
  
      await newPage.waitForSelector('.btn-primary');
      await newPage.click('.btn-primary');
      
      await newPage.goto(finalURL);
      
      await newPage.evaluate((customTitle) => {
        document.title = customTitle;
      }, customTitle);
  
      console.log("Number of tabs opened: " + tabsOpened);
    } catch (error) {
      // Handle the error
      console.error("An error occurred while opening the tab:", error);
    }
  }  

  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  input.on('line', (input) => {
    if (input.trim() === '') {
      isPaused = !isPaused;
      if (isPaused) {
        clearInterval(OPEN_TAB_ID);
        clearInterval(EVAL_ELEM_ID);
        console.log('Script paused. Press Enter again to resume.');
      } else {
        console.log('Script resumed.');
        init();
      }
    }
  });

  init()
}

monitorElementStatus();
