import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { Category } from '../../models/category.interface';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div>
      <div *ngIf="error" class="error">{{ error }}</div>
      <div *ngIf="successMessage" class="success">{{ successMessage }}</div>

      <form [formGroup]="productForm" (ngSubmit)="onSubmit()" id="productForm" aria-label="Product form">
        <div class="form-group">
          <label for="name">Name <span aria-label="required">*</span></label>
          <input 
            id="name" 
            type="text" 
            formControlName="name"
            aria-required="true"
            [attr.aria-invalid]="productForm.get('name')?.invalid && productForm.get('name')?.touched"
            aria-describedby="name-error" />
          <div 
            *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched" 
            class="error-message"
            id="name-error"
            role="alert">
            Name is required
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description" 
            formControlName="description"
            aria-describedby="description-help">
          </textarea>
          <small id="description-help" class="sr-only">Optional product description</small>
        </div>

        <div class="form-group">
          <label for="sku">SKU <span aria-label="required">*</span></label>
          <input 
            id="sku" 
            type="text" 
            formControlName="sku"
            aria-required="true"
            [attr.aria-invalid]="productForm.get('sku')?.invalid && productForm.get('sku')?.touched"
            aria-describedby="sku-error" />
          <div 
            *ngIf="productForm.get('sku')?.invalid && productForm.get('sku')?.touched" 
            class="error-message"
            id="sku-error"
            role="alert">
            SKU is required
          </div>
        </div>

        <div class="form-group">
          <label for="price">Price <span aria-label="required">*</span></label>
          <input 
            id="price" 
            type="number" 
            formControlName="price" 
            step="0.01" 
            min="0"
            aria-required="true"
            [attr.aria-invalid]="productForm.get('price')?.invalid && productForm.get('price')?.touched"
            aria-describedby="price-error" />
          <div 
            *ngIf="productForm.get('price')?.invalid && productForm.get('price')?.touched" 
            class="error-message"
            id="price-error"
            role="alert">
            Price must be greater than 0
          </div>
        </div>

        <div class="form-group">
          <label for="quantity">Quantity <span aria-label="required">*</span></label>
          <input 
            id="quantity" 
            type="number" 
            formControlName="quantity" 
            min="0"
            aria-required="true"
            [attr.aria-invalid]="productForm.get('quantity')?.invalid && productForm.get('quantity')?.touched"
            aria-describedby="quantity-error" />
          <div 
            *ngIf="productForm.get('quantity')?.invalid && productForm.get('quantity')?.touched" 
            class="error-message"
            id="quantity-error"
            role="alert">
            Quantity cannot be negative
          </div>
        </div>

        <div class="form-group">
          <label for="categoryId">Category</label>
          <select 
            id="categoryId" 
            formControlName="categoryId"
            aria-describedby="category-help">
            <option [value]="null">None</option>
            <option *ngFor="let category of categories" [value]="category.id">
              {{ category.name }}
            </option>
          </select>
          <small id="category-help" class="sr-only">Optional product category</small>
        </div>

      </form>
    </div>
    
    <div class="modal-footer">
      <button 
        type="button" 
        class="btn btn-secondary" 
        (click)="cancel()"
        aria-label="Cancel and close form">
        Cancel
      </button>
      <button 
        type="submit" 
        form="productForm" 
        class="btn btn-primary" 
        [disabled]="productForm.invalid || loading"
        [attr.aria-label]="isEditMode ? 'Update product' : 'Create product'">
        <span *ngIf="loading">
          <span aria-hidden="true">⏳</span> Saving...
        </span>
        <span *ngIf="!loading">
          {{ isEditMode ? 'Update' : 'Create' }}
        </span>
      </button>
    </div>
  `
})
export class ProductFormComponent implements OnInit {
  @Input() productId: number | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  productForm: FormGroup;
  categories: Category[] = [];
  isEditMode = false;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      sku: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    
    // Check if productId is provided as input (modal mode) or from route (page mode)
    const routeId = this.route.snapshot.paramMap.get('id');
    const id = this.productId || (routeId ? +routeId : null);
    
    if (id) {
      this.isEditMode = true;
      this.productId = id;
      this.loadProduct(id);
    } else if (this.productId === null && !routeId) {
      // New product mode - reset form
      this.isEditMode = false;
      this.productForm.reset({
        name: '',
        description: '',
        sku: '',
        price: 0,
        quantity: 0,
        categoryId: null
      });
    }
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          sku: product.sku,
          price: product.price,
          quantity: product.quantity,
          categoryId: product.categoryId
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load product';
        this.toastService.error('Failed to load product');
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

  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const productData = this.productForm.value;

    const operation = this.isEditMode
      ? this.productService.updateProduct(this.productId!, productData)
      : this.productService.createProduct(productData);

    operation.subscribe({
      next: () => {
        const message = this.isEditMode ? 'Product updated successfully!' : 'Product created successfully!';
        this.successMessage = message;
        this.toastService.success(message);
        this.loading = false;
        setTimeout(() => {
          this.saved.emit();
          // Only navigate if not in modal mode
          if (!this.productId && !this.route.snapshot.paramMap.get('id')) {
            this.router.navigate(['/products']);
          }
        }, 500);
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to save product';
        this.error = errorMsg;
        this.toastService.error(errorMsg);
        this.loading = false;
        console.error(err);
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
    // Only navigate if not in modal mode
    if (!this.productId && !this.route.snapshot.paramMap.get('id')) {
      this.router.navigate(['/products']);
    }
  }
}
