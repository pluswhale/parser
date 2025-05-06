import { Page } from 'puppeteer';
import { Category } from './types';
import { setUpInitialBrowserPage } from '../../puppetier';
import { sleep } from '../../utils';

export const fetchProductsBySubcategory = async (categories: Category[], domain: string) => {
  const page = await setUpInitialBrowserPage(domain);



  for (const category of categories.slice(0, 18)) {
    if (!category.subCategories || category.subCategories.length === 0) continue;

    const firstSub = category.subCategories[0];
    if (!firstSub.url.includes('category')) continue;

    const fullUrl = firstSub.url.startsWith('https') ? firstSub.url : domain + firstSub.url;
    console.log(`➡️ Visiting subcategory: ${firstSub.name} (${fullUrl})`);

    try {
      await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

      const isProductPage = await page.$('article.catalog-card');
      if (!isProductPage) {
        console.warn(`❌ No products found on page: ${fullUrl}`);
        continue;
      }


      const products = await page.$$eval('article.catalog-card', (cards) => {
        return cards.map((card) => {
          const img = card.querySelector('img.img-responsive');
          const image = img?.getAttribute('data-src') || '';
          return { image };
        });
      });

      firstSub.products = products;
      await sleep(3000);
    } catch (err) {
      console.warn(`⚠️ Failed to fetch products from ${fullUrl}:`, err.message);
    }
  }

  await page.close();

  return categories;
};

export const fetchCategoriesFromMuztorg = async (source: string): Promise<Category[]> => {
  const page = await setUpInitialBrowserPage(source);

  const button = await page.waitForSelector('.js-catalog-menu-button', { visible: true });
  await button.click();
  await page.waitForSelector('.catalog-window__aside', { visible: true });

  const categoryElements = await page.$$('.mt-catalog-menu__link');
  const categories: Category[] = [];

  for (const el of categoryElements) {
    const name = await el.evaluate((el) => el.textContent?.trim() || '');
    const url = await el.evaluate((el) => (el as HTMLAnchorElement).href || '');

    await el.hover();

    // Extract subcategories (first-level)
    const subcategoriesHandles = await page.$$('div.mt-catalog-submenu__item');

    const subCategories: Category[] = [];

    for (const handle of subcategoriesHandles) {
      const isVisible = await handle.evaluate((item) => {
        const style = window.getComputedStyle(item);
        return style.display !== 'none' && style.visibility !== 'hidden' && item.offsetParent !== null;
      });

      if (!isVisible) continue;

      const subName = await handle.$eval('a', (a) => a.textContent?.trim() || '');
      const subUrl = await handle.$eval('a', (a) => a.getAttribute('href') || '');

      const subCategory: Category = { name: subName, url: subUrl };

      // Check for nested subcategories
      const childUl = await handle.$('ul.mt-catalog-submenu._child');
      if (childUl) {
        const showMoreBtn = await handle.$('.mt-catalog-submenu__more.js-catalog-show-more');
        if (showMoreBtn) {
          try {
            await showMoreBtn.click();
          } catch (err) {
            console.warn('Could not click "Show more" for subcategory:', subName);
          }
        }

        const nestedSubcategories = await handle.$$eval('ul.mt-catalog-submenu._child li.mt-catalog-submenu__item a', (links) =>
          links.map((link) => ({
            name: link.textContent?.trim() || '',
            url: link.getAttribute('href') || ''
          }))
        );

        if (nestedSubcategories.length > 0) {
          subCategory.subCategories = nestedSubcategories;
        }
      }

      subCategories.push(subCategory);
    }

    categories.push({
      name,
      url,
      subCategories,
    });
  }

  return categories;
};