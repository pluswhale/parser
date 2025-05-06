export type Product = {
  image: string;
}

export type Category = {
  name: string;
  url: string;
  subCategories?: Category[];
  products?: Product[];
};