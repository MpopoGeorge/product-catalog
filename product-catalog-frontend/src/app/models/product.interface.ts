export interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  categoryId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProduct {
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  categoryId?: number | null;
}
