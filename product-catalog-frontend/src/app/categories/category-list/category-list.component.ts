import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category, CategoryTreeNode } from '../../models/category.interface';
import { CategoryTreeNodeComponent } from './category-tree-node.component';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CategoryTreeNodeComponent, ModalComponent],
  template: `
    <div>
      <h2>Categories</h2>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div>
          <h3>Category Tree</h3>
          <div *ngIf="loading" class="loading">Loading...</div>
          <div *ngIf="error" class="error">{{ error }}</div>
          <div *ngIf="categoryTree" style="background: white; padding: 15px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <category-tree-node [node]="categoryTree"></category-tree-node>
          </div>
        </div>

        <div>
          <h3>Categories</h3>
          <button class="btn btn-primary" (click)="openAddCategoryModal()" style="margin-bottom: 20px;">Add New Category</button>
          
          <!-- Category Form Modal -->
          <app-modal 
            [isOpen]="showCategoryModal" 
            title="Add New Category"
            (closeModal)="closeCategoryModal()">
            <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" id="categoryForm">
            <div class="form-group">
              <label for="name">Name *</label>
              <input id="name" type="text" formControlName="name" />
              <div *ngIf="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched" class="error-message">
                Name is required
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" formControlName="description"></textarea>
            </div>

            <div class="form-group">
              <label for="parentCategoryId">Parent Category</label>
              <select id="parentCategoryId" formControlName="parentCategoryId">
                <option [value]="null">None (Root Category)</option>
                <option *ngFor="let category of flatCategories" [value]="category.id">{{ category.name }}</option>
              </select>
            </div>

              <div *ngIf="error" class="error">{{ error }}</div>
              <div *ngIf="successMessage" class="success">{{ successMessage }}</div>
            </form>
            
            <div footer>
              <button type="button" class="btn btn-secondary" (click)="closeCategoryModal()">Cancel</button>
              <button type="submit" form="categoryForm" class="btn btn-primary" [disabled]="categoryForm.invalid || loading">
                {{ loading ? 'Creating...' : 'Create Category' }}
              </button>
            </div>
          </app-modal>
        </div>
      </div>
    </div>
  `
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
    this.categoryService.getCategoryTree().subscribe({
      next: (tree) => {
        this.categoryTree = tree;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load category tree';
        this.loading = false;
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
        this.loading = false;
        setTimeout(() => {
          this.closeCategoryModal();
          this.loadCategoryTree();
          this.loadCategories();
        }, 1000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create category';
        this.loading = false;
        console.error(err);
      }
    });
  }
}

