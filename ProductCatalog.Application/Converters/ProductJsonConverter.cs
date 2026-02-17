using System.Text.Json;
using System.Text.Json.Serialization;
using ProductCatalog.Application.DTOs;
using ProductCatalog.Domain;

namespace ProductCatalog.Application.Converters;

public class ProductJsonConverter : JsonConverter<ProductDto>
{
    public override ProductDto Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        // For this example, we'll use default deserialization
        return JsonSerializer.Deserialize<ProductDto>(ref reader, options) 
            ?? throw new JsonException("Failed to deserialize ProductDto");
    }

    public override void Write(Utf8JsonWriter writer, ProductDto value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        
        writer.WriteNumber("id", value.Id);
        writer.WriteString("name", value.Name);
        writer.WriteString("description", value.Description);
        writer.WriteString("sku", value.SKU);
        writer.WriteNumber("price", value.Price);
        writer.WriteNumber("quantity", value.Quantity);
        
        if (value.CategoryId.HasValue)
        {
            writer.WriteNumber("categoryId", value.CategoryId.Value);
        }
        else
        {
            writer.WriteNull("categoryId");
        }
        
        writer.WriteString("createdAt", value.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"));
        writer.WriteString("updatedAt", value.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"));
        
        // Add computed fields
        writer.WriteBoolean("inStock", value.Quantity > 0);
        writer.WriteString("formattedPrice", $"${value.Price:F2}");
        
        writer.WriteEndObject();
    }
}
