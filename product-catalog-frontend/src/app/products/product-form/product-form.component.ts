import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.interface';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div>
      <div *ngIf="error" class="error">{{ error }}</div>
      <div *ngIf="successMessage" class="success">{{ successMessage }}</div>

      <form [formGroup]="productForm" (ngSubmit)="onSubmit()" id="productForm">
        <div class="form-group">
          <label for="name">Name *</label>
          <input id="name" type="text" formControlName="name" />
          <div *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched" class="error-message">
            Name is required
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" formControlName="description"></textarea>
        </div>

        <div class="form-group">
          <label for="sku">SKU *</label>
          <input id="sku" type="text" formControlName="sku" />
          <div *ngIf="productForm.get('sku')?.invalid && productForm.get('sku')?.touched" class="error-message">
            SKU is required
          </div>
        </div>

        <div class="form-group">
          <label for="price">Price *</label>
          <input id="price" type="number" formControlName="price" step="0.01" min="0" />
          <div *ngIf="productForm.get('price')?.invalid && productForm.get('price')?.touched" class="error-message">
            Price must be greater than 0
          </div>
        </div>

        <div class="form-group">
          <label for="quantity">Quantity *</label>
          <input id="quantity" type="number" formControlName="quantity" min="0" />
          <div *ngIf="productForm.get('quantity')?.invalid && productForm.get('quantity')?.touched" class="error-message">
            Quantity cannot be negative
          </div>
        </div>

        <div class="form-group">
          <label for="categoryId">Category</label>
          <select id="categoryId" formControlName="categoryId">
            <option [value]="null">None</option>
            <option *ngFor="let category of categories" [value]="category.id">{{ category.name }}</option>
          </select>
        </div>

      </form>
    </div>
    
    <div footer>
      <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
      <button type="submit" form="productForm" class="btn btn-primary" [disabled]="productForm.invalid || loading">
        {{ loading ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
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
        this.successMessage = this.isEditMode ? 'Product updated successfully!' : 'Product created successfully!';
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
        this.error = err.error?.message || 'Failed to save product';
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
