import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { Category, CategoryTreeNode } from '../../models/category.interface';
import { CategoryTreeNodeComponent } from './category-tree-node.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CategoryTreeNodeComponent,
    ModalComponent,
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
        <h2 class="page-title">Categories</h2>
        <button 
          class="btn btn-primary" 
          (click)="openAddCategoryModal()"
          aria-label="Add new category">
          Add New Category
        </button>
      </div>

      <div class="category-grid">
        <div class="category-section">
          <h3>Category Tree</h3>
          <div *ngIf="loading">
            <app-loading-spinner message="Loading categories..."></app-loading-spinner>
          </div>
          <div *ngIf="error" class="error" role="alert">
            <strong>Error:</strong> {{ error }}
          </div>
          <div *ngIf="categoryTree && !loading" class="tree-container">
            <category-tree-node [node]="categoryTree"></category-tree-node>
          </div>
          <div *ngIf="!categoryTree && !loading && !error" class="empty-state">
            <div class="empty-state-icon">📁</div>
            <p class="empty-state-message">No categories found. Create your first category to get started.</p>
          </div>
        </div>

        <div class="category-section">
          <h3>Manage Categories</h3>
          
          <!-- Category Form Modal -->
          <app-modal 
            [isOpen]="showCategoryModal" 
            title="Add New Category"
            (closeModal)="closeCategoryModal()">
            <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" id="categoryForm" aria-label="Category form">
              <div class="form-group">
                <label for="name">Name <span aria-label="required">*</span></label>
                <input 
                  id="name" 
                  type="text" 
                  formControlName="name"
                  aria-required="true"
                  [attr.aria-invalid]="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched"
                  aria-describedby="name-error" />
                <div 
                  *ngIf="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched" 
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
                <small id="description-help" class="sr-only">Optional category description</small>
              </div>

              <div class="form-group">
                <label for="parentCategoryId">Parent Category</label>
                <select 
                  id="parentCategoryId" 
                  formControlName="parentCategoryId"
                  aria-describedby="parent-help">
                  <option [value]="null">None (Root Category)</option>
                  <option *ngFor="let category of flatCategories" [value]="category.id">
                    {{ category.name }}
                  </option>
                </select>
                <small id="parent-help" class="sr-only">Select a parent category to create a subcategory</small>
              </div>

              <div *ngIf="error" class="error" role="alert">{{ error }}</div>
              <div *ngIf="successMessage" class="success" role="alert">{{ successMessage }}</div>
            </form>
            
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="closeCategoryModal()"
                aria-label="Cancel and close form">
                Cancel
              </button>
              <button 
                type="submit" 
                form="categoryForm" 
                class="btn btn-primary" 
                [disabled]="categoryForm.invalid || loading"
                aria-label="Create category">
                <span *ngIf="loading">Creating...</span>
                <span *ngIf="!loading">Create Category</span>
              </button>
            </div>
          </app-modal>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .category-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
    }

    .category-section {
      background: white;
      padding: 20px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .category-section h3 {
      margin-top: 0;
      margin-bottom: 16px;
      color: #333;
    }

    .tree-container {
      padding: 15px;
      border-radius: 4px;
      background: #f8f9fa;
      min-height: 200px;
    }

    @media (max-width: 768px) {
      .category-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CategoryListComponent implements OnInit {
  categoryTree: CategoryTreeNode | null = null;
  flatCategories: Category[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  categoryForm: FormGroup;
  showCategoryModal = false;

  constructor(
    private categoryService: CategoryService,
    public toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      parentCategoryId: [null]
    });
  }

  ngOnInit(): void {
    this.loadCategoryTree();
    this.loadCategories();
  }

  loadCategoryTree(): void {
    this.loading = true;
    this.error = null;
    this.categoryService.getCategoryTree().subscribe({
      next: (tree) => {
        this.categoryTree = tree;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load category tree';
        this.loading = false;
        this.toastService.error('Failed to load category tree');
        console.error(err);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.flatCategories = categories;
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.toastService.error('Failed to load categories');
      }
    });
  }

  openAddCategoryModal(): void {
    this.categoryForm.reset();
    this.error = null;
    this.successMessage = null;
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.categoryForm.reset();
    this.error = null;
    this.successMessage = null;
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const categoryData = this.categoryForm.value;

    this.categoryService.createCategory(categoryData).subscribe({
      next: () => {
        this.successMessage = 'Category created successfully!';
        this.toastService.success('Category created successfully!');
        this.loading = false;
        setTimeout(() => {
          this.closeCategoryModal();
          this.loadCategoryTree();
          this.loadCategories();
        }, 1000);
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to create category';
        this.error = errorMsg;
        this.toastService.error(errorMsg);
        this.loading = false;
        console.error(err);
      }
    });
  }
}
