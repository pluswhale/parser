import puppeteer, { Browser, Page } from 'puppeteer';

type Site = 'muztorg';

type Category = {
  name: string;
  url: string;
};

const siteMapping: Record<Site, string> = {
  muztorg: 'https://www.muztorg.ru/',
};

async function fetchDataFromSource(source: string) {
  const page = await setUpInitialBrowserPage(source);

  //muztorg
  const categories = await fetchCategoriesFromMuztorg(page);
  const products = await fetchProductsFromMuztorg(categories);

  console.log('Fetched Categories from modal:', categories);
}

//muztorg data sets
fetchDataFromSource(siteMapping.muztorg);

//helpers
const fetchCategoriesFromMuztorg = async (page: Page) => {
  const button = await page.waitForSelector('.js-catalog-menu-button', { visible: true });

  await button.click();
  await page.waitForSelector('.catalog-window__aside', { visible: true });

  return await page.evaluate(() => {
    const categoryElements = document.querySelectorAll('.mt-catalog-menu__link');
    const result: Category[] = [];

    categoryElements.forEach((el) => {
      const name = el.textContent?.trim() || '';
      const href = (el as HTMLAnchorElement).href || '';
      if (name && href) {
        result.push({ name, url: href });
      }
    });

    return result;
  });
};

const fetchProductsFromMuztorg = async (categories: Category[]) => {
  const category = categories.find((category) => category.name === 'Наушники и гарнитуры');
  const page = await setUpInitialBrowserPage(siteMapping.muztorg);

  await sleep(5000);

  if (category.url) {
    await page.goto(category.url, { waitUntil: 'networkidle2' });
  } else {
    return;
  }

  await page.evaluate(() => {
    console.log('im here');

    const categoryElements = document.querySelectorAll('.category');

    console.log('category elems', categoryElements?.[0]);
  });
};

async function setUpInitialBrowserPage(source: string): Promise<Page> {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(source, { waitUntil: 'networkidle2' });

  await page.setViewport({ width: 1920, height: 1024 });

  await page.waitForSelector('body');

  return page;
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

