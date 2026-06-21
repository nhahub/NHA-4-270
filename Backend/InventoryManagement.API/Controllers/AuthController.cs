using Microsoft.AspNetCore.Mvc;
using InventoryManagement.Service.DTOs;
using InventoryManagement.Service.Interfaces;
using System;
using System.Threading.Tasks;

namespace InventoryManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var response = await _authService.LoginAsync(request);
                if (response == null)
                {
                    return BadRequest(new { message = "Invalid login credentials." });
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterTenantRequest request)
        {
            try
            {
                var success = await _authService.RegisterTenantAsync(request);
                return Ok(new { success, message = "Tenant workspace created and configured successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            try
            {
                var response = await _authService.RefreshSessionAsync(request);
                if (response == null)
                {
                    return Unauthorized(new { message = "Invalid or expired session." });
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("tenants")]
        public async Task<IActionResult> GetTenants()
        {
            var tenants = await _authService.GetTenantsAsync();
            return Ok(tenants);
        }
    }
}
