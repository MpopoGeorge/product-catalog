namespace ProductCatalog.Domain;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? ParentCategoryId { get; set; }

    // Navigation properties
    public Category? ParentCategory { get; set; }
    public List<Category> Children { get; set; } = new();
    public List<Product> Products { get; set; } = new();
}
