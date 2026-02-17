using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProductCatalog.Application.Services;

namespace ProductCatalog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthenticationService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthenticationService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest("Username and password are required");
        }

        var role = request.Username == "admin" ? "Admin" : "User";
        var token = _authService.GenerateToken(request.Username, role);

        return Ok(new { Token = token, Username = request.Username, Role = role });
    }

    [HttpGet("validate")]
    [Authorize]
    public IActionResult Validate()
    {
        var username = User.Identity?.Name;
        var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
        
        return Ok(new { Username = username, Role = role, Valid = true });
    }
}

public record LoginRequest(string Username, string Password);
