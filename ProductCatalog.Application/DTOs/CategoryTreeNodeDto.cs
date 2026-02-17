namespace ProductCatalog.Application.DTOs;

public record CategoryTreeNodeDto(
    int Id,
    string Name,
    string Description,
    int? ParentCategoryId,
    List<CategoryTreeNodeDto> Children
);
