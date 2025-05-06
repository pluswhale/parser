import puppeteer, { Page } from 'puppeteer';

export async function setUpInitialBrowserPage(source: string): Promise<Page> {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(source, { waitUntil: 'networkidle2' });

  await page.setViewport({ width: 1920, height: 1024 });

  await page.waitForSelector('body');

  return page;
}