using FluentAssertions;
using ProductCatalog.Domain;
using ProductCatalog.Infrastructure.Repositories;
using Xunit;

namespace ProductCatalog.Tests.Unit.Repositories;

public class InMemoryProductRepositoryTests
{
    private readonly InMemoryProductRepository _repository;

    public InMemoryProductRepositoryTests()
    {
        _repository = new InMemoryProductRepository();
    }

    [Fact]
    public async Task AddAsync_NewProduct_ReturnsProductWithId()
    {
        // Arrange
        var product = new Product
        {
            Name = "Test Product",
            Description = "Test Description",
            SKU = "TEST-001",
            Price = 99.99m,
            Quantity = 10
        };

        // Act
        var result = await _repository.AddAsync(product);

        // Assert
        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("Test Product");
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task GetByIdAsync_ExistingProduct_ReturnsProduct()
    {
        // Arrange
        var product = new Product { Name = "Test", SKU = "TEST-001", Price = 10m, Quantity = 1 };
        var added = await _repository.AddAsync(product);

        // Act
        var result = await _repository.GetByIdAsync(added.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(added.Id);
        result.Name.Should().Be("Test");
    }

    [Fact]
    public async Task GetByIdAsync_NonExistentProduct_ReturnsNull()
    {
        // Act
        var result = await _repository.GetByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllProducts()
    {
        // Arrange
        await _repository.AddAsync(new Product { Name = "Product 1", SKU = "P1", Price = 10m, Quantity = 1 });
        await _repository.AddAsync(new Product { Name = "Product 2", SKU = "P2", Price = 20m, Quantity = 2 });

        // Act
        var results = await _repository.GetAllAsync();

        // Assert
        results.Should().HaveCountGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task UpdateAsync_ExistingProduct_UpdatesProduct()
    {
        // Arrange
        var product = new Product { Name = "Original", SKU = "TEST-001", Price = 10m, Quantity = 1 };
        var added = await _repository.AddAsync(product);
        added.Name = "Updated";

        // Act
        var result = await _repository.UpdateAsync(added);

        // Assert
        result.Name.Should().Be("Updated");
        result.UpdatedAt.Should().BeAfter(result.CreatedAt);
    }

    [Fact]
    public async Task DeleteAsync_ExistingProduct_ReturnsTrue()
    {
        // Arrange
        var product = new Product { Name = "To Delete", SKU = "DEL-001", Price = 10m, Quantity = 1 };
        var added = await _repository.AddAsync(product);

        // Act
        var result = await _repository.DeleteAsync(added.Id);

        // Assert
        result.Should().BeTrue();
        var deleted = await _repository.GetByIdAsync(added.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_NonExistentProduct_ReturnsFalse()
    {
        // Act
        var result = await _repository.DeleteAsync(999);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ExistsAsync_ExistingProduct_ReturnsTrue()
    {
        // Arrange
        var product = new Product { Name = "Test", SKU = "TEST-001", Price = 10m, Quantity = 1 };
        var added = await _repository.AddAsync(product);

        // Act
        var result = await _repository.ExistsAsync(added.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task CountAsync_WithPredicate_ReturnsFilteredCount()
    {
        // Arrange
        await _repository.AddAsync(new Product { Name = "Laptop", SKU = "LAP-001", Price = 1000m, Quantity = 5 });
        await _repository.AddAsync(new Product { Name = "Mouse", SKU = "MOU-001", Price = 20m, Quantity = 10 });

        // Act
        var count = await _repository.CountAsync(p => p.Price > 100m);

        // Assert
        count.Should().BeGreaterThanOrEqualTo(1);
    }
}
