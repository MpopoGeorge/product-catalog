namespace ProductCatalog.Domain;

public class Product : IComparable<Product>
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public int? CategoryId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public Category? Category { get; set; }

    public int CompareTo(Product? other)
    {
        if (other == null) return 1;
        
        // Primary sort: by name
        int nameComparison = string.Compare(Name, other.Name, StringComparison.OrdinalIgnoreCase);
        if (nameComparison != 0) return nameComparison;
        
        // Secondary sort: by price (ascending)
        int priceComparison = Price.CompareTo(other.Price);
        if (priceComparison != 0) return priceComparison;
        
        // Tertiary sort: by SKU
        return string.Compare(SKU, other.SKU, StringComparison.OrdinalIgnoreCase);
    }
}
