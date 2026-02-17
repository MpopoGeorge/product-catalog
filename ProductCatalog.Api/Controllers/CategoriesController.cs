using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductCatalog.Application.DTOs;
using ProductCatalog.Application.Services;
using ProductCatalog.Domain;
using ProductCatalog.Infrastructure.Data;
using ProductCatalog.Infrastructure.Repositories;

namespace ProductCatalog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IRepository<Category> _repository;
    private readonly ProductCatalogDbContext _context;
    private readonly CategoryTreeService _treeService;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(
        IRepository<Category> repository,
        ProductCatalogDbContext context,
        CategoryTreeService treeService,
        ILogger<CategoriesController> logger)
    {
        _repository = repository;
        _context = context;
        _treeService = treeService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        var categories = await _context.Categories
            .Include(c => c.ParentCategory)
            .ToListAsync();

        var categoryDtos = categories.Select(MapToDto).ToList();
        return Ok(categoryDtos);
    }

    [HttpGet("tree")]
    public async Task<ActionResult<CategoryTreeNodeDto>> GetCategoryTree()
    {
        var categories = await _context.Categories
            .Include(c => c.ParentCategory)
            .Include(c => c.Children)
            .ToListAsync();

        var tree = _treeService.BuildTree(categories);
        return Ok(tree);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        if (dto.ParentCategoryId.HasValue)
        {
            var parentExists = await _repository.ExistsAsync(dto.ParentCategoryId.Value);
            if (!parentExists)
            {
                return BadRequest("Parent category not found");
            }
        }

        var category = new Category
        {
            Name = dto.Name,
            Description = dto.Description,
            ParentCategoryId = dto.ParentCategoryId
        };

        var createdCategory = await _repository.AddAsync(category);
        return CreatedAtAction(nameof(GetCategories), null, MapToDto(createdCategory));
    }

    private CategoryDto MapToDto(Category category)
    {
        return new CategoryDto(
            category.Id,
            category.Name,
            category.Description,
            category.ParentCategoryId
        );
    }
}
