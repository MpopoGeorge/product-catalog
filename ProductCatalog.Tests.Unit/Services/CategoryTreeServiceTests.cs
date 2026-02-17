using FluentAssertions;
using ProductCatalog.Application.DTOs;
using ProductCatalog.Application.Services;
using ProductCatalog.Domain;
using Xunit;

namespace ProductCatalog.Tests.Unit.Services;

public class CategoryTreeServiceTests
{
    private readonly CategoryTreeService _service;

    public CategoryTreeServiceTests()
    {
        _service = new CategoryTreeService();
    }

    [Fact]
    public void BuildTree_SingleRootCategory_ReturnsTreeWithRoot()
    {
        // Arrange
        var categories = new List<Category>
        {
            new Category { Id = 1, Name = "Electronics", Description = "Electronics category" }
        };

        // Act
        var tree = _service.BuildTree(categories);

        // Assert
        tree.Should().NotBeNull();
        tree.Children.Should().HaveCount(1);
        tree.Children[0].Name.Should().Be("Electronics");
    }

    [Fact]
    public void BuildTree_HierarchicalCategories_BuildsCorrectTree()
    {
        // Arrange
        var categories = new List<Category>
        {
            new Category { Id = 1, Name = "Electronics", Description = "Root" },
            new Category { Id = 2, Name = "Computers", Description = "Child", ParentCategoryId = 1 },
            new Category { Id = 3, Name = "Laptops", Description = "Grandchild", ParentCategoryId = 2 }
        };

        // Act
        var tree = _service.BuildTree(categories);

        // Assert
        tree.Children.Should().HaveCount(1);
        var electronics = tree.Children[0];
        electronics.Name.Should().Be("Electronics");
        electronics.Children.Should().HaveCount(1);
        electronics.Children[0].Name.Should().Be("Computers");
        electronics.Children[0].Children.Should().HaveCount(1);
        electronics.Children[0].Children[0].Name.Should().Be("Laptops");
    }

    [Fact]
    public void BuildTree_MultipleRootCategories_ReturnsMultipleRoots()
    {
        // Arrange
        var categories = new List<Category>
        {
            new Category { Id = 1, Name = "Electronics", Description = "Root 1" },
            new Category { Id = 2, Name = "Clothing", Description = "Root 2" }
        };

        // Act
        var tree = _service.BuildTree(categories);

        // Assert
        tree.Children.Should().HaveCount(2);
    }

    [Fact]
    public void BuildTree_EmptyList_ReturnsEmptyTree()
    {
        // Arrange
        var categories = new List<Category>();

        // Act
        var tree = _service.BuildTree(categories);

        // Assert
        tree.Should().NotBeNull();
        tree.Children.Should().BeEmpty();
    }
}
