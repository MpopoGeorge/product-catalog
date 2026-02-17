import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product } from '../../models/product.interface';
import { Category } from '../../models/category.interface';
import { ProductFormComponent } from '../product-form/product-form.component';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ProductFormComponent, ModalComponent],
  template: `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>Products</h2>
        <button class="btn btn-primary" (click)="openAddModal()">Add New Product</button>
      </div>

      <!-- Product Form Modal -->
      <app-modal 
        [isOpen]="showProductModal" 
        [title]="editingProduct ? 'Edit Product' : 'Add New Product'"
        (closeModal)="closeProductModal()">
        <app-product-form 
          *ngIf="showProductModal"
          [productId]="editingProductId"
          (saved)="onProductSaved()"
          (cancelled)="closeProductModal()">
        </app-product-form>
      </app-modal>

      <form [formGroup]="searchForm" (ngSubmit)="onSearch()" style="margin-bottom: 20px;">
        <div style="display: flex; gap: 10px;">
          <input 
            type="text" 
            formControlName="search" 
            placeholder="Search products..."
            style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <select formControlName="categoryId" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option [value]="null">All Categories</option>
            <option *ngFor="let category of categories" [value]="category.id">{{ category.name }}</option>
          </select>
          <button type="submit" class="btn btn-primary">Search</button>
          <button type="button" class="btn btn-secondary" (click)="clearSearch()">Clear</button>
        </div>
      </form>

      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="error" class="error">{{ error }}</div>

      <div *ngIf="!loading && !error">
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 4px; overflow: hidden;">
          <thead>
            <tr style="background-color: #007bff; color: white;">
              <th style="padding: 12px; text-align: left;">Name</th>
              <th style="padding: 12px; text-align: left;">SKU</th>
              <th style="padding: 12px; text-align: right;">Price</th>
              <th style="padding: 12px; text-align: right;">Quantity</th>
              <th style="padding: 12px; text-align: left;">Category</th>
              <th style="padding: 12px; text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let product of products" style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px;">{{ product.name }}</td>
              <td style="padding: 12px;">{{ product.sku }}</td>
              <td style="padding: 12px; text-align: right;">{{ formatPrice(product.price) }}</td>
              <td style="padding: 12px; text-align: right;">{{ product.quantity }}</td>
              <td style="padding: 12px;">{{ getCategoryName(product.categoryId) }}</td>
              <td style="padding: 12px; text-align: center;">
                <button class="btn btn-secondary" (click)="editProduct(product.id)" style="margin-right: 5px;">Edit</button>
                <button class="btn btn-danger" (click)="deleteProduct(product)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="products.length === 0" style="text-align: center; padding: 40px; background: white; border-radius: 4px; margin-top: 20px;">
          No products found.
        </div>
      </div>
    </div>
  `,
  styles: [`
    table {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    tbody tr:hover {
      background-color: #f8f9fa;
    }
  `]
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  loading = false;
  error: string | null = null;
  searchForm: FormGroup;
  showProductModal = false;
  editingProductId: number | null = null;
  editingProduct: Product | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      categoryId: [null]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
    const formValue = this.searchForm.value;
    
    this.productService.getProducts(
      formValue.search || undefined,
      formValue.categoryId || undefined
    ).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load products. Please check if the API is running.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }

  onSearch(): void {
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.loadProducts();
  }

  openAddModal(): void {
    this.editingProductId = null;
    this.editingProduct = null;
    this.showProductModal = true;
  }

  editProduct(id: number): void {
    this.editingProductId = id;
    this.editingProduct = this.products.find(p => p.id === id) || null;
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.editingProductId = null;
    this.editingProduct = null;
  }

  onProductSaved(): void {
    this.closeProductModal();
    this.loadProducts();
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          this.error = 'Failed to delete product';
          console.error(err);
        }
      });
    }
  }

  getCategoryName(categoryId: number | null | undefined): string {
    if (!categoryId) return 'None';
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
}
