const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const readline = require('readline');
require('dotenv').config();

// API/Keys Declaration
const BROWSER_ENDPOINT = process.argv[2]

const EUNICE_EMAIL = process.env.EUNICE_EMAIL
const EUNICE_PASSSWORD = process.env.EUNICE_PASSWORD
const CK_EMAIL1 = process.env.CHUNKHAI_EMAIL1
const CK_EMAIL2 = process.env.CHUNKHAI_EMAIL2
const CK_PASSWORD = process.env.CHUNKHAI_PASSWORD

const EMAIL_ADDRESS = EUNICE_EMAIL
const PASSWORD = EUNICE_PASSSWORD

const taytayURL = 'https://www.google.com/search?q=taylorswift&oq=taylorswift&aqs=chrome..69i57.1830j0j1&sourceid=chrome&ie=UTF-8'
const initialURL = 'https://ticketmaster.sg/login';
const finalURL = 'https://click.mailing.ticketmaster.com/?qs=2d32134119df64f25e745e413bfa5c0d7adb93969de6de7c11f82ff431185145ea34971a579f8e42bd8a57691121379a8f9a5576413829b491030b11f2a019f5';

let OPEN_TAB_ID;
const OPEN_TAB_INTERVAL = 3000; // 5 seconds
var isPaused = false;

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
      if (openTabs.length <= 60) {
        var tabsOpened = openTabs.length;
        const newPage = await browser.newPage();
        const customTitle = `Tab ${tabsOpened}`;
        openTabs.push({ page: newPage, title: customTitle });
    
        await newPage.goto(initialURL);
    
        const signInFormUsernameExists = await newPage.$('#signInFormUsername');
        const signInFormPasswordExists = await newPage.$('#signInFormPassword');
    
        if (signInFormUsernameExists && signInFormPasswordExists) {
          await newPage.waitForSelector('#signInFormUsername');
          await newPage.type('#signInFormUsername', EMAIL_ADDRESS);
    
          await newPage.waitForSelector('#signInFormPassword');
          await newPage.type('#signInFormPassword', PASSWORD);
        }
    
        await newPage.waitForSelector('.btn-primary');
        await newPage.click('.btn-primary');
        
        await new Promise(resolve => setTimeout(resolve, 3000))
  
        await newPage.goto(finalURL);
        
        await newPage.evaluate((customTitle) => {
          document.title = customTitle;
        }, customTitle);
    
        console.log("Number of tabs opened: " + tabsOpened);
      } else {
        clearInterval(OPEN_TAB_ID);
        console.log('all tabs opened')
      }
    } catch (error) {
      // Handle the error
      console.error("An error occurred while opening the tab:", error);
    }
  }  

  async function navigateAllTabs(url) {
    try {
      const refreshTabs = openTabs.map(tab => {
        return new Promise(async (resolve) => {
          await tab.page.goto(url)
        })
      })
  
      await Promise.all(refreshTabs)
    } catch (error) {
      console.log('Something when wrong when redirecting. Error: ' + error)
    }
  }

  async function refreshAllTabs() {
    try {
      const refreshTabs = openTabs.map(tab => {
        return new Promise(async (resolve) => {
          await tab.page.reload()
        })
      })
  
      await Promise.all(refreshTabs)
    } catch (error) {
      console.log('Something when wrong when refreshing. Error: ' + error)
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
        console.log('Script paused. Press Enter again to resume.');
      
      } else {
          console.log('Script resumed.');
          init();
        }  
    } else if (isPaused) {
      if (input.trim() === 'goto') {
        navigateAllTabs(finalURL)
        console.log('All tabs redirected to new URL')
      
      } else if (input.trim() === 'refresh') {
        refreshAllTabs();
        console.log('All tabs refreshed')
      }
    } else {
      console.log('pause first')
    }
  });

  init()
}

monitorElementStatus();
