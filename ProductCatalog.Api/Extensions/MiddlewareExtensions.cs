using Microsoft.AspNetCore.Builder;
using ProductCatalog.Application.Middleware;

namespace ProductCatalog.Api.Extensions;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestLoggingMiddleware>();
    }
}
