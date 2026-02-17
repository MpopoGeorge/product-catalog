using FluentAssertions;
using ProductCatalog.Application.Services;
using Xunit;

namespace ProductCatalog.Tests.Unit.Services;

public class SearchCacheServiceTests
{
    private readonly SearchCacheService _cacheService;

    public SearchCacheServiceTests()
    {
        _cacheService = new SearchCacheService();
    }

    [Fact]
    public void Set_AndGet_ReturnsCachedValue()
    {
        // Arrange
        var key = "test-key";
        var data = new List<string> { "item1", "item2" };

        // Act
        _cacheService.Set(key, data);
        var result = _cacheService.Get<List<string>>(key);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(data);
    }

    [Fact]
    public void Get_NonExistentKey_ReturnsNull()
    {
        // Act
        var result = _cacheService.Get<List<string>>("non-existent");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void TryGet_ExistingKey_ReturnsTrue()
    {
        // Arrange
        var key = "test-key";
        var data = "test-data";
        _cacheService.Set(key, data);

        // Act
        var success = _cacheService.TryGet<string>(key, out var result);

        // Assert
        success.Should().BeTrue();
        result.Should().Be(data);
    }

    [Fact]
    public void Remove_ExistingKey_RemovesFromCache()
    {
        // Arrange
        var key = "test-key";
        _cacheService.Set(key, "data");

        // Act
        _cacheService.Remove(key);
        var result = _cacheService.Get<string>(key);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void Clear_RemovesAllEntries()
    {
        // Arrange
        _cacheService.Set("key1", "data1");
        _cacheService.Set("key2", "data2");

        // Act
        _cacheService.Clear();
        var result1 = _cacheService.Get<string>("key1");
        var result2 = _cacheService.Get<string>("key2");

        // Assert
        result1.Should().BeNull();
        result2.Should().BeNull();
    }
}
