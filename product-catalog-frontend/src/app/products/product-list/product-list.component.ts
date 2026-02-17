import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../models/product.interface';
import { Category } from '../../models/category.interface';
import { ProductFormComponent } from '../product-form/product-form.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ProductFormComponent,
    ModalComponent,
    ConfirmDialogComponent,
    LoadingSpinnerComponent,
    ToastComponent
  ],
  template: `
    <div>
      <app-toast 
        [message]="(toastService.toast$ | async)?.message || null"
        [type]="(toastService.toast$ | async)?.type || 'info'">
      </app-toast>

      <div class="page-header">
        <h2 class="page-title">Products</h2>
        <button 
          class="btn btn-primary" 
          (click)="openAddModal()"
          aria-label="Add new product">
          Add New Product
        </button>
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

      <!-- Delete Confirmation Modal -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Delete Product"
        [message]="deleteConfirmMessage"
        confirmText="Delete"
        (confirmed)="confirmDelete()"
        (cancelled)="cancelDelete()">
      </app-confirm-dialog>

      <form [formGroup]="searchForm" (ngSubmit)="onSearch()" class="search-form" role="search" aria-label="Product search">
        <input 
          type="text" 
          formControlName="search" 
          placeholder="Search products by name or description..."
          class="search-input"
          aria-label="Search products">
        <select 
          formControlName="categoryId" 
          class="filter-select"
          aria-label="Filter by category"
          (change)="onCategoryChange()">
          <option [value]="null">All Categories</option>
          <option *ngFor="let category of categories" [value]="category.id">
            {{ category.name }}
          </option>
        </select>
        <button type="submit" class="btn btn-primary" aria-label="Search">Search</button>
        <button 
          type="button" 
          class="btn btn-secondary" 
          (click)="clearSearch()"
          aria-label="Clear search filters">
          Clear
        </button>
      </form>

      <div *ngIf="loading">
        <app-loading-spinner message="Loading products..."></app-loading-spinner>
      </div>

      <div *ngIf="error" class="error" role="alert">
        <strong>Error:</strong> {{ error }}
      </div>

      <div *ngIf="!loading && !error">
        <div *ngIf="products.length > 0" class="table-container">
          <table class="table" role="table" aria-label="Products list">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">SKU</th>
                <th scope="col" class="text-right">Price</th>
                <th scope="col" class="text-right">Quantity</th>
                <th scope="col">Category</th>
                <th scope="col" class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let product of products">
                <td>{{ product.name }}</td>
                <td>{{ product.sku }}</td>
                <td class="text-right">{{ formatPrice(product.price) }}</td>
                <td class="text-right">
                  <span [class.text-danger]="product.quantity === 0" [class.text-warning]="product.quantity > 0 && product.quantity < 10">
                    {{ product.quantity }}
                  </span>
                </td>
                <td>{{ getCategoryName(product.categoryId) }}</td>
                <td class="text-center">
                  <button 
                    class="btn btn-secondary" 
                    (click)="editProduct(product.id)"
                    [attr.aria-label]="'Edit ' + product.name"
                    style="margin-right: 5px;">
                    Edit
                  </button>
                  <button 
                    class="btn btn-danger" 
                    (click)="deleteProduct(product)"
                    [attr.aria-label]="'Delete ' + product.name">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="products.length === 0" class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3 class="empty-state-title">No products found</h3>
          <p class="empty-state-message">
            <span *ngIf="hasActiveFilters()">
              Try adjusting your search or filter criteria.
            </span>
            <span *ngIf="!hasActiveFilters()">
              Get started by adding your first product.
            </span>
          </p>
          <button 
            *ngIf="!hasActiveFilters()"
            class="btn btn-primary" 
            (click)="openAddModal()"
            style="margin-top: 16px;">
            Add Your First Product
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .text-danger {
      color: #dc3545;
      font-weight: 600;
    }

    .text-warning {
      color: #ffc107;
      font-weight: 600;
    }
  `]
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: Category[] = [];
  loading = false;
  error: string | null = null;
  searchForm: FormGroup;
  showProductModal = false;
  showDeleteConfirm = false;
  editingProductId: number | null = null;
  editingProduct: Product | null = null;
  productToDelete: Product | null = null;
  deleteConfirmMessage = '';

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    public toastService: ToastService,
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

    // Debounced search
    this.searchForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (!this.loading) {
          this.loadProducts();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        this.toastService.error('Failed to load products');
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
        this.toastService.error('Failed to load categories');
      }
    });
  }

  onSearch(): void {
    this.loadProducts();
  }

  onCategoryChange(): void {
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.loadProducts();
  }

  hasActiveFilters(): boolean {
    const formValue = this.searchForm.value;
    return !!(formValue.search || formValue.categoryId);
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
    this.toastService.success('Product saved successfully!');
  }

  deleteProduct(product: Product): void {
    this.productToDelete = product;
    this.deleteConfirmMessage = `Are you sure you want to delete "${product.name}"? This action cannot be undone.`;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.productToDelete) return;

    this.productService.deleteProduct(this.productToDelete.id).subscribe({
      next: () => {
        this.toastService.success(`Product "${this.productToDelete!.name}" deleted successfully`);
        this.loadProducts();
        this.productToDelete = null;
      },
      error: (err) => {
        this.error = 'Failed to delete product';
        this.toastService.error('Failed to delete product');
        console.error(err);
        this.productToDelete = null;
      }
    });
  }

  cancelDelete(): void {
    this.productToDelete = null;
    this.showDeleteConfirm = false;
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
