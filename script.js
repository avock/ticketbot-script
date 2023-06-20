const puppeteer = require('puppeteer');
const Table = require('cli-table3');
const readline = require('readline');

async function monitorElementStatus() {
  const websiteUrl = 'https://ticketmaster.sg/activity/detail/24_coldplay';
  const elementSelector = '#hlLinkToQueueTicket2';
  const delayBetweenTabs = 6000; // 10 seconds
  const monitoringInterval = 10000; // 5 seconds

  const browser = await puppeteer.launch({ headless: false });
  const mainPage = await browser.newPage();
  const openPages = [mainPage]; // Store references to all open pages

  let previousTexts = Array(openPages.length).fill(''); // Array to store previous element texts

  // Define a helper function to evaluate the status and text of the element on a specific page
  const evaluateElementStatus = async (page, tabIndex) => {
    try {
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
  await mainPage.goto(websiteUrl);

  // Monitor the element status at a regular interval
  setInterval(async () => {
    const elementStatuses = await Promise.all(
      openPages.map((page, index) => evaluateElementStatus(page, index))
    );

    // Create and display the table
    const table = new Table({
      head: ['Status', 'Element Text'],
      colWidths: [20, 40],
    });

    elementStatuses.forEach((status, index) => {
      const row = [status.status, status.text];
      table.push(row);
    });

    console.log(table.toString());
  }, monitoringInterval);

  // Open additional websites in new tabs
  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  input.question('Press any key and Enter to stop the script...', async () => {
    input.close();
    await browser.close();
    process.exit(0);
  });

  while (true) {
    const newPage = await browser.newPage();
    openPages.push(newPage); // Add the new page reference to the openPages array
    await newPage.goto(websiteUrl);
    await newPage.waitForTimeout(delayBetweenTabs);
  }
}

monitorElementStatus();
