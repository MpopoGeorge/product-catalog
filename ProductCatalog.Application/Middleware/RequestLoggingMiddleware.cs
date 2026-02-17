using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ProductCatalog.Application.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var startTime = DateTime.UtcNow;
        var requestPath = context.Request.Path.Value ?? string.Empty;
        var requestMethod = context.Request.Method;

        _logger.LogInformation(
            "Incoming request: {Method} {Path} at {Time}",
            requestMethod,
            requestPath,
            startTime);

        await _next(context);

        var endTime = DateTime.UtcNow;
        var duration = (endTime - startTime).TotalMilliseconds;
        var statusCode = context.Response.StatusCode;

        _logger.LogInformation(
            "Completed request: {Method} {Path} - Status: {StatusCode} - Duration: {Duration}ms",
            requestMethod,
            requestPath,
            statusCode,
            duration);
    }
}
