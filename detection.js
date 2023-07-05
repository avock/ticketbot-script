const puppeteer = require('puppeteer-extra');
const readline = require('readline');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const telegramAPI = process.env.TELEGRAM_BOT_API
const groupChatID = process.env.GROUP_CHAT_ID
const telegram = new TelegramBot(telegramAPI, { polling: true });

async function monitorElementChange() {
  const targetURL = 'https://ticketmaster.sg/activity/detail/24_taylorswift'; // Replace with your target URL

  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  let isPaused = false; // Flag to track pause/resume state

  rl.on('line', (input) => {
    if (input.toLowerCase() === '') {
      isPaused = !isPaused; // Toggle pause/resume state
      console.log(`Monitoring is ${isPaused ? 'paused' : 'resumed'}.`);
    }
  });

  while (true) {
    if (!isPaused) {
      // Go to the webpage
      await page.goto(targetURL, { waitUntil: 'networkidle0' });

      // Wait for the element to be visible
      await page.waitForSelector('#synopsis', { visible: true });

      // Evaluate the innerText of the element
      const elementInnerText = await page.evaluate(() => {
        const element = document.querySelector('#additional-button');
        return element ? element.innerText : '';
      });

      if (elementInnerText) {
        console.log(`Element text has changed: ${elementInnerText}`);
        telegram.sendMessage(groupChatID, 'IMPORTANT: check the loading page, the queue has started')

      } else {
        console.log('Element text remains the same.');
      }
    }

    await sleep(30000); // Wait for 15 seconds before the next iteration
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

monitorElementChange();
