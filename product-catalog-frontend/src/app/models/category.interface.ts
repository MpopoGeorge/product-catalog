export interface Category {
  id: number;
  name: string;
  description: string;
  parentCategoryId?: number | null;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  description: string;
  parentCategoryId?: number | null;
  children: CategoryTreeNode[];
}

export interface CreateCategory {
  name: string;
  description: string;
  parentCategoryId?: number | null;
}
