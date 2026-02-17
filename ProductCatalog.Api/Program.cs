using Microsoft.EntityFrameworkCore;
using ProductCatalog.Api.Extensions;
using ProductCatalog.Application.Services;
using ProductCatalog.Domain;
using ProductCatalog.Infrastructure.Data;
using ProductCatalog.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Product Catalog API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<ProductCatalogDbContext>(options =>
    options.UseInMemoryDatabase("ProductCatalogDb"));

builder.Services.AddScoped<IRepository<Product>>(provider =>
{
    var context = provider.GetRequiredService<ProductCatalogDbContext>();
    return new Repository<Product>(context);
});
builder.Services.AddScoped<IRepository<Category>>(provider =>
{
    var context = provider.GetRequiredService<ProductCatalogDbContext>();
    return new Repository<Category>(context);
});

var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ProductCatalogApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ProductCatalogClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

builder.Services.AddSingleton<SearchCacheService>();
builder.Services.AddScoped<CategoryTreeService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();

builder.Services.AddScoped<ProductSearchEngine<Product>>(provider =>
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

    return new ProductSearchEngine<Product>(fieldExtractors, fieldWeights);
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ProductCatalogDbContext>();
    SeedData(context);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRequestLogging();

app.UseHttpsRedirection();
app.UseCors("AllowAngularApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

static void SeedData(ProductCatalogDbContext context)
{
    if (context.Categories.Any()) return;

    var electronics = new Category { Name = "Electronics", Description = "Electronic devices and accessories" };
    var computers = new Category { Name = "Computers", Description = "Computers and laptops", ParentCategoryId = null };
    var phones = new Category { Name = "Phones", Description = "Mobile phones and accessories", ParentCategoryId = null };
    
    context.Categories.AddRange(electronics, computers, phones);
    context.SaveChanges();

    computers.ParentCategoryId = electronics.Id;
    phones.ParentCategoryId = electronics.Id;
    context.SaveChanges();

    var products = new List<Product>
    {
        new Product
        {
            Name = "Laptop Pro 15",
            Description = "High-performance laptop with 16GB RAM and 512GB SSD",
            SKU = "LAP-001",
            Price = 1299.99m,
            Quantity = 10,
            CategoryId = computers.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        },
        new Product
        {
            Name = "Smartphone X",
            Description = "Latest smartphone with advanced camera system",
            SKU = "PHN-001",
            Price = 899.99m,
            Quantity = 25,
            CategoryId = phones.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        },
        new Product
        {
            Name = "Wireless Mouse",
            Description = "Ergonomic wireless mouse with long battery life",
            SKU = "ACC-001",
            Price = 29.99m,
            Quantity = 50,
            CategoryId = electronics.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }
    };

    context.Products.AddRange(products);
    context.SaveChanges();
}

public partial class Program { }
