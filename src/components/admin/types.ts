// Plain, serialisable shapes passed from admin server components to client forms.

export type AdminPackSize = {
  id: string;
  label: string;
  mrp: number;
  wholesalePrice: number | null;
  active: boolean;
  sortOrder: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  usage: string;
  images: string[];
  minOrderQty: number;
  unitsPerCarton: number | null;
  availability: string;
  featured: boolean;
  active: boolean;
  showPrice: boolean;
  sortOrder: number;
  packSizes: AdminPackSize[];
};
