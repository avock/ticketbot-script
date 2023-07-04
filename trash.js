const puppeteer = require('puppeteer');
const Table = require('cli-table3');
const readline = require('readline');
require('dotenv').config();

const targetURL = "https://www.ipaddress.my";
const API_KEY = process.env.API_KEY;
const scraperAPI = "http://api.scraperapi.com";

// const finalURL = `${scraperAPI}?api_key=${API_KEY}&url=${targetURL}`;
const finalURL = 'https://www.google.com';

// setup puppeteer to open browser and launch new tabs
const browser = puppeteer.launch({ headless: false});
const mainPage = browser.newPage();
// Store references to all open tabs with custom titles
var openTabs = [{ page: mainPage, title: 'Main Tab' }]; 

const elementSelector = '#hlLinkToQueueTicket2';
const delayBetweenTabs = 5000; // 5 seconds
const monitoringInterval = 5000; // 5 seconds

// helper function to evaluate the status and text of the element on a specific tab
// TODO logic update: to set to CHANGED once changed once, else will a successful tab will turn back to UNCHANGED
async function evaluateElementStatus(tab, tabIndex) {
  try {
    const page = tab.page;
    await page.waitForSelector(elementSelector);
    const element = await page.$(elementSelector);
    const elementText = await page.evaluate((el) => el.innerText, element);

    const status = elementText === previousTexts[tabIndex] ? 'Unchanged' : 'Changed';

    // Update the previous element text to be the current text
    previousTexts[tabIndex] = elementText; 

    return { status, text: elementText };

  } catch (error) {
    return { status: 'Error', text: 'Error evaluating element status' };
  }
}

// main function that monitors the target element on each page
async function CLITableHelper() {
  // Create and display the CLI table
  var table = new Table({
    head: ['Tab Title', 'Status', 'Element Text'],
    colWidths: [20, 20, 40],
  });

  // checks target element on each tab
  const elementStatuses = await Promise.all(
    openTabs.map((tab, index) => evaluateElementStatus(tab, index))
  );

  // populates CLI table with status from each tab
  elementStatuses.forEach((status, index) => {
    const { title } = openTabs[index];
    const row = [title, status.status, status.text];
    table.push(row);
  });

  // prints out the CLI table
  console.log(table.toString());
}

async function newTabHelper() {
  const newPage = await browser.newPage();
  const customTitle = `Tab ${openTabs.length + 1}`;
  openTabs.push({ page: newPage, title: customTitle }); // Add the new tab reference with custom title to the openTabs array
  await newPage.goto(finalURL);
  await newPage.evaluate((customTitle) => {
    document.title = customTitle; // Set the browser tab title to the custom title
  }, customTitle);
}

async function init() { 

  // Open initial website in the main tab
  await mainPage.goto(finalURL);

  // opens tabbs at regular interval
  setInterval(newTabHelper, delayBetweenTabs);
  // Monitor the element status + update CLI table at a regular interval
  setInterval(CLITableHelper, monitoringInterval);
  
  // CLI table initializtation
  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  input.question('Press any key and Enter to stop the script...', async () => {
    input.close();
    await browser.close();
    process.exit(0);
  });
}

init()