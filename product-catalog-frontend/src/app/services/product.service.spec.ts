import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product } from '../models/product.interface';
import { API_BASE_URL } from '../app.config';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch products', () => {
    const mockProducts: Product[] = [
      {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        sku: 'TEST-001',
        price: 99.99,
        quantity: 10,
        categoryId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    service.getProducts().subscribe(products => {
      expect(products.length).toBe(1);
      expect(products[0].name).toBe('Test Product');
    });

    const req = httpMock.expectOne(`${API_BASE_URL}/api/products?page=1&pageSize=20&ascending=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('should create a product', () => {
    const newProduct = {
      name: 'New Product',
      description: 'New Description',
      sku: 'NEW-001',
      price: 49.99,
      quantity: 5,
      categoryId: 1
    };

    const createdProduct: Product = {
      id: 2,
      ...newProduct,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    service.createProduct(newProduct).subscribe(product => {
      expect(product.id).toBe(2);
      expect(product.name).toBe('New Product');
    });

    const req = httpMock.expectOne(`${API_BASE_URL}/api/products`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newProduct);
    req.flush(createdProduct);
  });
});
