using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ProductCatalog.Application.DTOs;
using ProductCatalog.Domain;
using ProductCatalog.Infrastructure.Data;
using Xunit;

namespace ProductCatalog.Tests.Integration;

public class ProductsControllerTests : IClassFixture<WebApplicationFactory<ProductCatalog.Api.Program>>, IDisposable
{
    private readonly WebApplicationFactory<ProductCatalog.Api.Program> _factory;
    private readonly HttpClient _client;
    private readonly ProductCatalogDbContext _context;

    public ProductsControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove the existing DbContext registration
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ProductCatalogDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // Add in-memory database for testing
                services.AddDbContext<ProductCatalogDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid());
                });
            });
        });

        _client = _factory.CreateClient();
        _context = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<ProductCatalogDbContext>();
    }

    [Fact]
    public async Task GetProducts_ReturnsSuccessStatusCode()
    {
        // Act
        var response = await _client.GetAsync("/api/products");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetProduct_ExistingId_ReturnsProduct()
    {
        // Arrange
        var product = new Product
        {
            Name = "Test Product",
            Description = "Test Description",
            SKU = "TEST-001",
            Price = 99.99m,
            Quantity = 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/products/{product.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ProductDto>();
        result.Should().NotBeNull();
        result!.Name.Should().Be("Test Product");
    }

    [Fact]
    public async Task GetProduct_NonExistentId_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/products/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateProduct_ValidProduct_ReturnsCreated()
    {
        // Arrange
        var createDto = new CreateProductDto(
            "New Product",
            "New Description",
            "NEW-001",
            49.99m,
            5,
            null
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/products", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<ProductDto>();
        result.Should().NotBeNull();
        result!.Name.Should().Be("New Product");
        result.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CreateProduct_InvalidProduct_ReturnsBadRequest()
    {
        // Arrange
        var createDto = new CreateProductDto(
            "", // Invalid: empty name
            "Description",
            "SKU-001",
            10m,
            1,
            null
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/products", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateProduct_ExistingProduct_ReturnsOk()
    {
        // Arrange
        var product = new Product
        {
            Name = "Original",
            Description = "Original Description",
            SKU = "ORIG-001",
            Price = 10m,
            Quantity = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var updateDto = new UpdateProductDto(
            "Updated",
            "Updated Description",
            "ORIG-001",
            20m,
            2,
            null
        );

        // Act
        var response = await _client.PutAsJsonAsync($"/api/products/{product.Id}", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ProductDto>();
        result.Should().NotBeNull();
        result!.Name.Should().Be("Updated");
    }

    [Fact]
    public async Task DeleteProduct_ExistingProduct_ReturnsNoContent()
    {
        // Arrange
        var product = new Product
        {
            Name = "To Delete",
            Description = "Description",
            SKU = "DEL-001",
            Price = 10m,
            Quantity = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/products/{product.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task GetProducts_WithSearchQuery_ReturnsFilteredResults()
    {
        // Arrange
        _context.Products.AddRange(
            new Product { Name = "Laptop", SKU = "LAP-001", Price = 1000m, Quantity = 5, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Product { Name = "Mouse", SKU = "MOU-001", Price = 20m, Quantity = 10, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/products?search=Laptop");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var results = await response.Content.ReadFromJsonAsync<List<ProductDto>>();
        results.Should().NotBeNull();
        results!.Should().Contain(p => p.Name.Contains("Laptop", StringComparison.OrdinalIgnoreCase));
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _client.Dispose();
    }
}

