using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using InventoryManagement.Repository.Interfaces;
using InventoryManagement.Service.Interfaces;

namespace InventoryManagement.API.Providers
{
    public class TenantProvider : ITenantProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TenantProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string TenantId
        {
            get
            {
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext == null) return "acme";

                if (httpContext.Items.TryGetValue("TenantId", out var tenantIdObj) && tenantIdObj is string tenantId)
                {
                    return tenantId;
                }

                var headerTenantId = httpContext.Request.Headers["X-Tenant-ID"].ToString();
                if (!string.IsNullOrEmpty(headerTenantId))
                {
                    return headerTenantId.ToLower().Trim();
                }

                var user = httpContext.User;
                var claimTenantId = user.FindFirst("TenantId")?.Value;
                if (!string.IsNullOrEmpty(claimTenantId))
                {
                    return claimTenantId.ToLower().Trim();
                }

                return "acme";
            }
        }
    }

    public class UserProvider : IUserProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string CurrentUserEmail => 
            _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value ?? "system@inventory.com";

        public string CurrentUserName
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;
                if (user == null) return "System";
                var firstName = user.FindFirst("FirstName")?.Value ?? string.Empty;
                var lastName = user.FindFirst("LastName")?.Value ?? string.Empty;
                var name = $"{firstName} {lastName}".Trim();
                return string.IsNullOrEmpty(name) ? "System" : name;
            }
        }

        public string CurrentUserRole => 
            _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value ?? "Staff";
    }
}
