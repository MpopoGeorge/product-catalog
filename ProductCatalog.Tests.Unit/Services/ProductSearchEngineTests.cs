using FluentAssertions;
using ProductCatalog.Application.Services;
using ProductCatalog.Domain;
using Xunit;

namespace ProductCatalog.Tests.Unit.Services;

public class ProductSearchEngineTests
{
    private readonly ProductSearchEngine<Product> _searchEngine;

    public ProductSearchEngineTests()
    {
        var fieldExtractors = new Dictionary<string, Func<Product, string>>
        {
            { "name", p => p.Name },
            { "description", p => p.Description },
            { "sku", p => p.SKU }
        };

        var fieldWeights = new Dictionary<string, double>
        {
            { "name", 3.0 },
            { "sku", 2.0 },
            { "description", 1.0 }
        };

        _searchEngine = new ProductSearchEngine<Product>(fieldExtractors, fieldWeights);
    }

    [Fact]
    public void Search_ExactMatch_ReturnsHighScore()
    {
        // Arrange
        var products = new List<Product>
        {
            new Product { Id = 1, Name = "Laptop", Description = "A laptop computer", SKU = "LAP-001" },
            new Product { Id = 2, Name = "Mouse", Description = "A computer mouse", SKU = "MOU-001" }
        };

        // Act
        var results = _searchEngine.Search(products, "Laptop");

        // Assert
        results.Should().NotBeEmpty();
        results[0].Item.Name.Should().Be("Laptop");
        results[0].Score.Should().BeGreaterThan(0.5);
    }

    [Fact]
    public void Search_FuzzyMatch_ReturnsResults()
    {
        // Arrange
        var products = new List<Product>
        {
            new Product { Id = 1, Name = "Laptop", Description = "A laptop computer", SKU = "LAP-001" }
        };

        // Act
        var results = _searchEngine.Search(products, "lptop"); // Typo: missing 'a'

        // Assert
        results.Should().NotBeEmpty();
        results[0].Item.Name.Should().Be("Laptop");
    }

    [Fact]
    public void Search_EmptyQuery_ReturnsAllItems()
    {
        // Arrange
        var products = new List<Product>
        {
            new Product { Id = 1, Name = "Laptop", Description = "A laptop", SKU = "LAP-001" },
            new Product { Id = 2, Name = "Mouse", Description = "A mouse", SKU = "MOU-001" }
        };

        // Act
        var results = _searchEngine.Search(products, "");

        // Assert
        results.Should().HaveCount(2);
    }

    [Fact]
    public void Search_NoMatches_ReturnsEmpty()
    {
        // Arrange
        var products = new List<Product>
        {
            new Product { Id = 1, Name = "Laptop", Description = "A laptop", SKU = "LAP-001" }
        };

        // Act
        var results = _searchEngine.Search(products, "xyzabc123");

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void Search_WeightedScoring_PrioritizesName()
    {
        // Arrange
        var products = new List<Product>
        {
            new Product { Id = 1, Name = "Laptop", Description = "A laptop computer", SKU = "LAP-001" },
            new Product { Id = 2, Name = "Computer", Description = "A laptop device", SKU = "COM-001" }
        };

        // Act
        var results = _searchEngine.Search(products, "laptop");

        // Assert
        results.Should().NotBeEmpty();
        // Name match should score higher than description match
        var laptopResult = results.FirstOrDefault(r => r.Item.Name == "Laptop");
        var computerResult = results.FirstOrDefault(r => r.Item.Name == "Computer");
        
        laptopResult.Should().NotBeNull();
        computerResult.Should().NotBeNull();
        laptopResult!.Score.Should().BeGreaterThan(computerResult!.Score);
    }

    [Fact]
    public void Search_MaxResults_LimitsResults()
    {
        // Arrange
        var products = Enumerable.Range(1, 100)
            .Select(i => new Product { Id = i, Name = $"Product {i}", Description = "Description", SKU = $"SKU-{i}" })
            .ToList();

        // Act
        var results = _searchEngine.Search(products, "Product", maxResults: 10);

        // Assert
        results.Should().HaveCountLessThanOrEqualTo(10);
    }
}
