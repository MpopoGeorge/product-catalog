using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductCatalog.Application.Converters;
using ProductCatalog.Application.DTOs;
using ProductCatalog.Application.Extensions;
using ProductCatalog.Application.Services;
using ProductCatalog.Domain;
using ProductCatalog.Infrastructure.Data;
using ProductCatalog.Infrastructure.Repositories;
using System.Text.Json;

namespace ProductCatalog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IRepository<Product> _repository;
    private readonly ProductCatalogDbContext _context;
    private readonly ProductSearchEngine<Product> _searchEngine;
    private readonly SearchCacheService _cacheService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(
        IRepository<Product> repository,
        ProductCatalogDbContext context,
        ProductSearchEngine<Product> searchEngine,
        SearchCacheService cacheService,
        ILogger<ProductsController> logger)
    {
        _repository = repository;
        _context = context;
        _searchEngine = searchEngine;
        _cacheService = cacheService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts(
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool ascending = true)
    {
        var cacheKey = $"products_{search}_{categoryId}_{page}_{pageSize}_{sortBy}_{ascending}";
        if (_cacheService.TryGet<List<ProductDto>>(cacheKey, out var cachedResult))
        {
            return Ok(cachedResult);
        }

        IQueryable<Product> query = _context.Products.Include(p => p.Category);

        query = query.FilterByName(search)
                    .FilterByCategory(categoryId);

        query = query.SortBy(sortBy, ascending);

        var totalCount = await query.CountAsync();

        var products = await query.Paginate(page, pageSize).ToListAsync();

        var productDtos = products.Select(MapToDto).ToList();

        _cacheService.Set(cacheKey, productDtos);

        Response.Headers.Append("X-Total-Count", totalCount.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        return Ok(productDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return NotFound();
        }

        return Ok(MapToDto(product));
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        var validationResult = ValidateProduct(dto);
        if (validationResult is ValidationError error)
        {
            return BadRequest(error.Message);
        }

        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            SKU = dto.SKU,
            Price = dto.Price,
            Quantity = dto.Quantity,
            CategoryId = dto.CategoryId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var existingProduct = await _context.Products
            .FirstOrDefaultAsync(p => p.SKU == dto.SKU);

        if (existingProduct != null)
        {
            return BadRequest("Product with this SKU already exists");
        }

        var createdProduct = await _repository.AddAsync(product);

        _cacheService.Clear();

        return CreatedAtAction(nameof(GetProduct), new { id = createdProduct.Id }, MapToDto(createdProduct));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        var product = await _repository.GetByIdAsync(id);
        if (product == null)
        {
            return NotFound();
        }

        var validationResult = ValidateProductUpdate(dto);
        if (validationResult is ValidationError error)
        {
            return BadRequest(error.Message);
        }

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.SKU = dto.SKU;
        product.Price = dto.Price;
        product.Quantity = dto.Quantity;
        product.CategoryId = dto.CategoryId;
        product.UpdatedAt = DateTime.UtcNow;

        var updatedProduct = await _repository.UpdateAsync(product);

        _cacheService.Clear();

        return Ok(MapToDto(updatedProduct));
    }

    [HttpPut("{id}/manual")]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<ActionResult<ProductDto>> UpdateProductManual(int id)
    {
        var form = await Request.ReadFormAsync();
        var name = form["name"].ToString();
        var description = form["description"].ToString();
        var sku = form["sku"].ToString();
        
        if (!decimal.TryParse(form["price"].ToString(), out var price))
            return BadRequest("Invalid price format");
        
        if (!int.TryParse(form["quantity"].ToString(), out var quantity))
            return BadRequest("Invalid quantity format");
        
        int? categoryId = null;
        if (!string.IsNullOrEmpty(form["categoryId"].ToString()) && 
            int.TryParse(form["categoryId"].ToString(), out var catId))
        {
            categoryId = catId;
        }

        var product = await _repository.GetByIdAsync(id);
        if (product == null)
        {
            return NotFound();
        }

        product.Name = name ?? product.Name;
        product.Description = description ?? product.Description;
        product.SKU = sku ?? product.SKU;
        product.Price = price;
        product.Quantity = quantity;
        product.CategoryId = categoryId;
        product.UpdatedAt = DateTime.UtcNow;

        var updatedProduct = await _repository.UpdateAsync(product);

        _cacheService.Clear();

        return Ok(MapToDto(updatedProduct));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var deleted = await _repository.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound();
        }

        _cacheService.Clear();

        return NoContent();
    }

    [HttpGet("search")]
    public async Task<ActionResult> SearchProducts([FromQuery] string query)
    {
        var allProducts = await _context.Products.Include(p => p.Category).ToListAsync();

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

        var searchEngine = new ProductSearchEngine<Product>(fieldExtractors, fieldWeights);
        var results = searchEngine.Search(allProducts, query ?? string.Empty, maxResults: 50);

        var productDtos = results.Select(r => MapToDto(r.Item)).ToList();

        var options = new JsonSerializerOptions
        {
            Converters = { new ProductJsonConverter() }
        };

        return new JsonResult(productDtos, options);
    }

    private ProductDto MapToDto(Product product)
    {
        return new ProductDto(
            product.Id,
            product.Name,
            product.Description,
            product.SKU,
            product.Price,
            product.Quantity,
            product.CategoryId,
            product.CreatedAt,
            product.UpdatedAt
        );
    }

    private object ValidateProduct(CreateProductDto dto)
    {
        return dto switch
        {
            { Name: null or "" } => new ValidationError("Name is required"),
            { SKU: null or "" } => new ValidationError("SKU is required"),
            { Price: <= 0 } => new ValidationError("Price must be greater than 0"),
            { Quantity: < 0 } => new ValidationError("Quantity cannot be negative"),
            _ => new ValidationSuccess()
        };
    }

    private object ValidateProductUpdate(UpdateProductDto dto)
    {
        return dto switch
        {
            { Name: null or "" } => new ValidationError("Name is required"),
            { SKU: null or "" } => new ValidationError("SKU is required"),
            { Price: <= 0 } => new ValidationError("Price must be greater than 0"),
            { Quantity: < 0 } => new ValidationError("Quantity cannot be negative"),
            _ => new ValidationSuccess()
        };
    }

    private record ValidationError(string Message);
    private record ValidationSuccess();
}
