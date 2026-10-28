import finalizedMenu from "./menu-final.json";

// The finalized Nairobi menu is the source of truth. Add photo paths here.

export type MenuCategory = (typeof finalizedMenu.categories)[number]["id"];

export type MenuItem = {
  id: string;

  name: string;

  category: MenuCategory;

  description: string;

  image: string | null;

  imageCredit?: {
    author: string;
    url: string;
    license: string;
    licenseUrl: string;
    label: string;
  };

  sourceDocument: string;

  sourcePage: number;

  price?: number;

  variants?: { label: string; price: number }[];
};

// Preserve the complete menu. Assigning an image automatically restores an item.

export const allMenuItems: MenuItem[] = finalizedMenu.items;

export const menuItems = allMenuItems;

export const menuCategories = finalizedMenu.categories;

export function formatMenuPrice(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}
