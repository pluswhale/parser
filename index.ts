import { fileURLToPath } from 'url';
import path from 'path';
import { writeFileSync } from 'fs';
import { fetchCategoriesFromMuztorg, fetchProductsBySubcategory } from './sources/muztorg/fetchers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


type Site = 'muztorg';

const siteMapping: Record<Site, string> = {
  muztorg: 'https://www.muztorg.ru/',
};

async function fetchDataFromMuztorg(source: string) {
  const categories = await fetchCategoriesFromMuztorg(source);
  const categoriesWithProducts = await fetchProductsBySubcategory(categories, source);

  const outputPath = path.join(__dirname, 'categories.json');
  writeFileSync(outputPath, JSON.stringify(categoriesWithProducts, null, 2), 'utf-8');
}


fetchDataFromMuztorg(siteMapping.muztorg);

