import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, CreateProduct } from '../models/product.interface';
import { API_BASE_URL } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${API_BASE_URL}/api/products`;

  constructor(private http: HttpClient) {}

  getProducts(search?: string, categoryId?: number, page: number = 1, pageSize: number = 20, sortBy?: string, ascending: boolean = true): Observable<Product[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('ascending', ascending.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }
    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }

    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: CreateProduct): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: number, product: CreateProduct): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('query', query)
    });
  }
}
