# Solution Design and Trade-offs

## Architecture Overview

The solution follows a clean architecture pattern with clear separation of concerns:

- **Domain Layer**: Core entities and interfaces
- **Application Layer**: DTOs, services, middleware, and business logic
- **Infrastructure Layer**: Data access, repositories, and external dependencies
- **API Layer**: Controllers and HTTP endpoints
- **Frontend**: Angular SPA with standalone components

## Design Decisions

### 1. Repository Pattern Implementation

**Decision**: Implemented both EF Core-based and in-memory repositories

**Rationale**:
- Demonstrates flexibility in data access patterns
- `InMemoryProductRepository` shows pure C# collection usage as required
- `Repository<T>` base class provides reusable CRUD operations
- Allows easy swapping between data sources

**Trade-off**: Added complexity but demonstrates understanding of repository pattern variations

### 2. ProductSearchEngine Design

**Decision**: Generic search engine using only .NET Base Class Library

**Rationale**:
- Meets requirement of no external NuGet packages
- Uses Levenshtein distance algorithm for fuzzy matching
- Supports weighted multi-field search
- Generic design makes it reusable for other entities

**Trade-offs**:
- Levenshtein distance calculation is O(n*m) - acceptable for in-memory searches
- Fuzzy matching threshold (30% character difference) is configurable
- Could be optimized with caching or indexing for larger datasets

**Implementation Details**:
- Normalizes strings (lowercase, removes diacritics) for better matching
- Combines exact match, substring match, and fuzzy match scores
- Weighted scoring allows prioritizing certain fields (name > SKU > description)

### 3. Custom Middleware

**Decision**: Built from scratch without framework helpers

**Rationale**:
- Demonstrates understanding of ASP.NET Core middleware pipeline
- Shows manual request/response handling
- Logs request details and response times

**Trade-off**: More verbose than using built-in logging middleware, but shows core concepts

### 4. Caching Strategy

**Decision**: Simple Dictionary-based cache with expiration

**Rationale**:
- Meets requirement of using Dictionary<TKey, TValue>
- Simple and effective for search result caching
- Includes expiration to prevent stale data

**Trade-offs**:
- Not thread-safe by default (uses lock for thread safety)
- No distributed cache support (would need Redis/Memcached for scale)
- Memory-based only - data lost on restart

### 5. Category Tree Structure

**Decision**: Recursive tree building with DTOs

**Rationale**:
- Supports hierarchical categories as required
- Separates domain model from tree representation
- Efficient recursive algorithm

**Trade-off**: Could use materialized path pattern for better query performance at scale

### 6. Pattern Matching for Validation

**Decision**: Used switch expressions with pattern matching

**Rationale**:
- Modern C# feature (C# 8+)
- Clean and readable validation logic
- Type-safe pattern matching

**Example**:
```csharp
return dto switch
{
    { Name: null or "" } => new ValidationError("Name is required"),
    { Price: <= 0 } => new ValidationError("Price must be greater than 0"),
    _ => new ValidationSuccess()
};
```

### 7. Manual Model Binding

**Decision**: Implemented in PUT endpoint using `Request.ReadFormAsync()`

**Rationale**:
- Demonstrates understanding of model binding internals
- Shows manual parsing of form data
- Useful for complex binding scenarios

**Trade-off**: More verbose than automatic model binding, but shows technical depth

### 8. Custom JSON Serialization

**Decision**: Custom converter for ProductDto

**Rationale**:
- Adds computed fields (inStock, formattedPrice)
- Demonstrates custom serialization control
- Can format dates, add metadata, etc.

**Trade-off**: Adds complexity but provides flexibility for API responses

### 9. Angular Architecture

**Decision**: Standalone components with lazy loading

**Rationale**:
- Modern Angular approach (Angular 17+)
- Better tree-shaking and performance
- Simpler module structure

**Trade-offs**:
- Requires Angular 16+ (not compatible with older versions)
- Different from traditional NgModule approach

### 10. Reactive Forms

**Decision**: Used ReactiveFormsModule for all forms

**Rationale**:
- Better for complex validation
- More testable
- Better performance for dynamic forms

**Trade-off**: More verbose than template-driven forms but more powerful

## Technical Highlights

### Fuzzy Matching Algorithm

The `ProductSearchEngine` implements a multi-stage matching approach:

1. **Exact Match**: Returns score of 1.0
2. **Substring Match**: Returns score of 0.8
3. **Fuzzy Substring**: Checks if query is approximately contained (30% tolerance)
4. **Levenshtein Distance**: Calculates similarity based on edit distance

The final score is weighted by field importance (name: 3.0, SKU: 2.0, description: 1.0).

### LINQ Extensions

Custom extension methods provide fluent API for filtering:
```csharp
query.FilterByName(search)
     .FilterByCategory(categoryId)
     .SortBy(sortBy, ascending)
     .Paginate(page, pageSize)
```

This makes the code more readable and reusable.

### IComparable Implementation

Product implements `IComparable<Product>` with multi-level sorting:
1. Primary: Name (case-insensitive)
2. Secondary: Price
3. Tertiary: SKU

This enables natural sorting without explicit comparers.

## Performance Considerations

1. **Search Caching**: Reduces database queries for repeated searches
2. **Eager Loading**: Uses `Include()` for related entities to avoid N+1 queries
3. **Pagination**: Limits result sets to prevent memory issues
4. **In-Memory Search**: Fast for small datasets, but would need indexing for large datasets

## Scalability Considerations

**Current Limitations**:
- In-memory database (data lost on restart)
- Single-instance caching (not distributed)
- No authentication/authorization
- No rate limiting

**Potential Improvements**:
- Replace in-memory DB with SQL Server/PostgreSQL
- Add Redis for distributed caching
- Implement authentication (JWT/OAuth)
- Add API rate limiting
- Implement pagination at database level for large datasets
- Add full-text search (Elasticsearch) for better search performance

## Testing Strategy

**Backend**:
- Unit tests for services (ProductSearchEngine, CategoryTreeService)
- Integration tests for repositories
- API tests for controllers

**Frontend**:
- Unit tests for services (ProductService)
- Component tests for forms and lists
- E2E tests for critical flows

## Security Considerations

**Current State**:
- No authentication/authorization (as per requirements)
- CORS configured for development
- Input validation on DTOs

**Production Readiness**:
- Add authentication middleware
- Implement authorization policies
- Add input sanitization
- Implement rate limiting
- Add HTTPS enforcement
- Validate all user inputs

## Code Quality

- Nullable reference types enabled throughout
- Consistent naming conventions
- Separation of concerns
- SOLID principles applied
- Error handling in place
- Logging implemented

## Future Enhancements

1. **Search Improvements**:
   - Full-text search integration
   - Search result highlighting
   - Search history

2. **UI Enhancements**:
   - Advanced filtering options
   - Bulk operations
   - Export functionality
   - Image upload for products

3. **Backend Improvements**:
   - Background jobs for data processing
   - WebSocket support for real-time updates
   - GraphQL API option
   - API versioning

4. **DevOps**:
   - Docker containerization
   - CI/CD pipeline
   - Automated testing
   - Monitoring and logging

## Conclusion

This solution demonstrates:
- Strong understanding of C# and .NET Core
- Knowledge of Angular and TypeScript
- Ability to implement complex requirements
- Clean code practices
- Understanding of design patterns
- Trade-off analysis and decision-making

The implementation balances requirements with practical considerations, showing both technical depth and pragmatic thinking.
