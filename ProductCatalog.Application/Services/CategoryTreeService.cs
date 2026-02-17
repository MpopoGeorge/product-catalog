using ProductCatalog.Application.DTOs;
using ProductCatalog.Domain;

namespace ProductCatalog.Application.Services;

public class CategoryTreeService
{
    public CategoryTreeNodeDto BuildTree(IEnumerable<Category> categories)
    {
        var categoryList = categories.ToList();
        var categoryMap = categoryList.ToDictionary(c => c.Id);
        var rootCategories = categoryList.Where(c => c.ParentCategoryId == null).ToList();

        return new CategoryTreeNodeDto(
            Id: 0,
            Name: "Root",
            Description: "Root category",
            ParentCategoryId: null,
            Children: rootCategories.Select(c => BuildTreeNode(c, categoryMap)).ToList()
        );
    }

    public List<CategoryTreeNodeDto> BuildTreeList(IEnumerable<Category> categories)
    {
        var categoryList = categories.ToList();
        var categoryMap = categoryList.ToDictionary(c => c.Id);

        var rootCategories = categoryList.Where(c => c.ParentCategoryId == null).ToList();

        return rootCategories.Select(c => BuildTreeNode(c, categoryMap)).ToList();
    }

    private CategoryTreeNodeDto BuildTreeNode(Category category, Dictionary<int, Category> categoryMap)
    {
        var children = categoryMap.Values
            .Where(c => c.ParentCategoryId == category.Id)
            .Select(c => BuildTreeNode(c, categoryMap))
            .ToList();

        return new CategoryTreeNodeDto(
            Id: category.Id,
            Name: category.Name,
            Description: category.Description,
            ParentCategoryId: category.ParentCategoryId,
            Children: children
        );
    }
}
