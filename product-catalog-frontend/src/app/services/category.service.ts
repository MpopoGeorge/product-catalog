import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryTreeNode, CreateCategory } from '../models/category.interface';
import { API_BASE_URL } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${API_BASE_URL}/api/categories`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  getCategoryTree(): Observable<CategoryTreeNode> {
    return this.http.get<CategoryTreeNode>(`${this.apiUrl}/tree`);
  }

  createCategory(category: CreateCategory): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }
}
