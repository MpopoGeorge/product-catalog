using ProductCatalog.Domain;

namespace ProductCatalog.Application.Extensions;

public static class LinqExtensions
{
    public static IQueryable<Product> FilterByCategory(this IQueryable<Product> query, int? categoryId)
    {
        if (categoryId.HasValue)
        {
            return query.Where(p => p.CategoryId == categoryId.Value);
        }
        return query;
    }

    public static IQueryable<Product> FilterByMinPrice(this IQueryable<Product> query, decimal? minPrice)
    {
        if (minPrice.HasValue)
        {
            return query.Where(p => p.Price >= minPrice.Value);
        }
        return query;
    }

    public static IQueryable<Product> FilterByMaxPrice(this IQueryable<Product> query, decimal? maxPrice)
    {
        if (maxPrice.HasValue)
        {
            return query.Where(p => p.Price <= maxPrice.Value);
        }
        return query;
    }

    public static IQueryable<Product> FilterByAvailability(this IQueryable<Product> query, bool? inStock)
    {
        if (inStock.HasValue)
        {
            if (inStock.Value)
            {
                return query.Where(p => p.Quantity > 0);
            }
            else
            {
                return query.Where(p => p.Quantity == 0);
            }
        }
        return query;
    }

    public static IQueryable<Product> FilterByName(this IQueryable<Product> query, string? searchTerm)
    {
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            return query.Where(p => p.Name.Contains(searchTerm) || p.Description.Contains(searchTerm));
        }
        return query;
    }

    public static IQueryable<Product> Paginate(this IQueryable<Product> query, int page, int pageSize)
    {
        return query.Skip((page - 1) * pageSize).Take(pageSize);
    }

    public static IQueryable<Product> SortBy(this IQueryable<Product> query, string? sortBy, bool ascending = true)
    {
        return sortBy?.ToLowerInvariant() switch
        {
            "name" => ascending ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
            "price" => ascending ? query.OrderBy(p => p.Price) : query.OrderByDescending(p => p.Price),
            "quantity" => ascending ? query.OrderBy(p => p.Quantity) : query.OrderByDescending(p => p.Quantity),
            "createdat" => ascending ? query.OrderBy(p => p.CreatedAt) : query.OrderByDescending(p => p.CreatedAt),
            _ => query.OrderBy(p => p.Name) // Default sort
        };
    }
}
