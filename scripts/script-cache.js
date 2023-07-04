const puppeteer = require('puppeteer');
const Table = require('cli-table3');
const readline = require('readline');
require('dotenv').config();

async function monitorElementStatus() {
  const targetURL = "https://www.ipaddress.my";
  const API_KEY = process.env.API_KEY;
  const scraperAPI = "http://api.scraperapi.com";

  // const finalURL = `${scraperAPI}?api_key=${API_KEY}&url=${targetURL}`;
  const finalURL = 'https://ticketmaster.sg/activity/detail/24_taylorswift';
  
  // Create and display the table
  const table = new Table({
    head: ['Tab Title', 'Status', 'Element Text'],
    colWidths: [20, 20, 40],
  });

  // const elementSelector = '#hlLinkToQueueTicket2';
  const elementSelector = '.an-bk';
  const delayBetweenTabs = 5000; // 5 seconds
  const monitoringInterval = 5000; // 5 seconds

  const browser = await puppeteer.launch({ headless: false});
  const mainPage = await browser.newPage();
  const openTabs = [{ page: mainPage, title: 'Main Tab' }]; // Store references to all open tabs with custom titles

  let previousTexts = Array(openTabs.length).fill(''); // Array to store previous element texts

  // Define a helper function to evaluate the status and text of the element on a specific tab
  const evaluateElementStatus = async (tab, tabIndex) => {
    try {
      const page = tab.page;
      await page.waitForSelector(elementSelector);
      const element = await page.$(elementSelector);
      const elementText = await page.evaluate((el) => el.innerText, element);

      const status = elementText === previousTexts[tabIndex] ? 'Unchanged' : 'Changed';

      previousTexts[tabIndex] = elementText; // Update the previous element text

      return { status, text: elementText };
    } catch (error) {
      return { status: 'Error', text: 'Error evaluating element status' };
    }
  };

  // Open initial website in the main tab
  await mainPage.goto(finalURL);

  // Monitor the element status at a regular interval
  async function monitorElementStatus() {
    const elementStatuses = await Promise.all(
      openTabs.map((tab, index) => evaluateElementStatus(tab, index))
    );
      
    // clears table then re-enters every single element
    table.splice(0);

    elementStatuses.forEach((status, index) => {
      if(status.status === 'Changed') {        
        const { title } = openTabs[index];
        const row = [title, status.status, status.text];
        table.push(row);
      }
    });
  }

  // Open additional websites in new tabs with custom titles
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
    openTabs.push({ page: newPage, title: customTitle }); // Add the new tab reference with custom title to the openTabs array
    await newPage.goto(finalURL);
    await newPage.waitForTimeout(delayBetweenTabs);
    await newPage.evaluate((customTitle) => {
      document.title = customTitle; // Set the browser tab title to the custom title
    }, customTitle);
    monitorElementStatus();
    console.log(table.toString());
  }
}

monitorElementStatus();
