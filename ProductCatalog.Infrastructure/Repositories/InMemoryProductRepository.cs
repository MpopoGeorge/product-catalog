using System.Linq.Expressions;
using ProductCatalog.Domain;

namespace ProductCatalog.Infrastructure.Repositories;

public class InMemoryProductRepository : IRepository<Product>
{
    private readonly Dictionary<int, Product> _products = new();
    private int _nextId = 1;
    private readonly object _lock = new();

    public Task<Product?> GetByIdAsync(int id)
    {
        lock (_lock)
        {
            _products.TryGetValue(id, out var product);
            return Task.FromResult(product);
        }
    }

    public Task<IEnumerable<Product>> GetAllAsync()
    {
        lock (_lock)
        {
            return Task.FromResult<IEnumerable<Product>>(_products.Values.ToList());
        }
    }

    public Task<IEnumerable<Product>> FindAsync(Expression<Func<Product, bool>> predicate)
    {
        lock (_lock)
        {
            var compiled = predicate.Compile();
            var results = _products.Values.Where(compiled).ToList();
            return Task.FromResult<IEnumerable<Product>>(results);
        }
    }

    public Task<Product> AddAsync(Product entity)
    {
        lock (_lock)
        {
            entity.Id = _nextId++;
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            _products[entity.Id] = entity;
            return Task.FromResult(entity);
        }
    }

    public Task<Product> UpdateAsync(Product entity)
    {
        lock (_lock)
        {
            if (!_products.ContainsKey(entity.Id))
                throw new KeyNotFoundException($"Product with ID {entity.Id} not found");
            
            entity.UpdatedAt = DateTime.UtcNow;
            _products[entity.Id] = entity;
            return Task.FromResult(entity);
        }
    }

    public Task<bool> DeleteAsync(int id)
    {
        lock (_lock)
        {
            return Task.FromResult(_products.Remove(id));
        }
    }

    public Task<bool> ExistsAsync(int id)
    {
        lock (_lock)
        {
            return Task.FromResult(_products.ContainsKey(id));
        }
    }

    public Task<int> CountAsync(Expression<Func<Product, bool>>? predicate = null)
    {
        lock (_lock)
        {
            if (predicate == null)
                return Task.FromResult(_products.Count);
            
            var compiled = predicate.Compile();
            return Task.FromResult(_products.Values.Count(compiled));
        }
    }
}
