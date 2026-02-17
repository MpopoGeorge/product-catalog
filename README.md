# Product Catalog Management System

A full-stack application for managing product inventory with a C# Web API backend and Angular frontend.

## Project Structure

```
product-catalog-system/
├── ProductCatalog.Api/              # ASP.NET Core Web API
├── ProductCatalog.Application/      # Application layer (DTOs, Services, Middleware)
├── ProductCatalog.Domain/           # Domain models and interfaces
├── ProductCatalog.Infrastructure/   # Data access and repositories
└── product-catalog-frontend/        # Angular frontend application
```

## Prerequisites

- .NET 9.0 SDK
- Node.js 18+ and npm
- Angular CLI 17+

## Backend Setup

1. Navigate to the solution directory:
   ```bash
   cd ProductCatalog.Api
   ```

2. Restore NuGet packages:
   ```bash
   dotnet restore
   ```

3. Run the API:
   ```bash
   dotnet run
   ```

   The API will be available at `http://localhost:5000` (or `https://localhost:5001`)

4. Swagger UI will be available at `http://localhost:5000/swagger` (in development mode)

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd product-catalog-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:4200`

## API Endpoints

### Products

- `GET /api/products` - Get all products (supports pagination, filtering, search)
  - Query parameters: `search`, `categoryId`, `page`, `pageSize`, `sortBy`, `ascending`
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create a new product
- `PUT /api/products/{id}` - Update a product (uses manual model binding)
- `DELETE /api/products/{id}` - Delete a product
- `GET /api/products/search` - Advanced search with fuzzy matching

### Categories

- `GET /api/categories` - Get all categories (flat list)
- `GET /api/categories/tree` - Get categories as hierarchical tree
- `POST /api/categories` - Create a new category

## Features

### Backend
- Repository pattern with EF Core and in-memory implementations
- Product search with fuzzy matching
- Category tree structure
- JWT authentication
- Custom middleware and caching

### Frontend
- Angular standalone components
- Product and category management
- Search and filtering
- Form validation

## Testing

### Backend

Run all tests:
```bash
dotnet test
```

Run specific test projects:
```bash
dotnet test ProductCatalog.Tests.Unit
dotnet test ProductCatalog.Tests.Integration
```

### Frontend

Run unit tests:
```bash
cd product-catalog-frontend
npm test
```

## Docker Support

### Using Docker Compose

Build and start all services:
```bash
docker-compose up --build
```

Start in background:
```bash
docker-compose up -d
```

Stop services:
```bash
docker-compose down
```

Services will be available at:
- API: `http://localhost:5000`
- Frontend: `http://localhost:4200`

### Individual Docker Builds

Backend:
```bash
docker build -f ProductCatalog.Api/Dockerfile -t product-catalog-api .
docker run -p 5000:80 product-catalog-api
```

Frontend:
```bash
docker build -f product-catalog-frontend/Dockerfile -t product-catalog-frontend ./product-catalog-frontend
docker run -p 4200:80 product-catalog-frontend
```

## Authentication

JWT authentication is implemented. Login endpoint accepts any username/password for demo purposes.

```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "password"
}
```

Include the token in requests:
```
Authorization: Bearer {token}
```

## Notes

- Backend uses Entity Framework Core with an in-memory database
- CORS configured for `http://localhost:4200`
- Seed data included for testing
- JWT authentication implemented

## Troubleshooting

### CORS Issues

If you encounter CORS errors, ensure:
1. The backend is running on the correct port
2. CORS is properly configured in `Program.cs`
3. The frontend API URL matches the backend URL

### API Connection Issues

Update the API URL in the Angular services if your backend runs on a different port:
- `product-catalog-frontend/src/app/services/product.service.ts`
- `product-catalog-frontend/src/app/services/category.service.ts`
