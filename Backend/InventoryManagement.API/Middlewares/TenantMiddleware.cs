using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace InventoryManagement.API.Middlewares
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // 1. Prioritize JWT Claim first (if authenticated)
            var claimTenantId = context.User.FindFirst("TenantId")?.Value;
            
            // 2. Second priority is the X-Tenant-ID header
            var tenantId = context.Request.Headers["X-Tenant-ID"].ToString();

            string resolvedTenantId = "acme"; // fallback

            if (!string.IsNullOrEmpty(claimTenantId))
            {
                resolvedTenantId = claimTenantId.ToLower().Trim();
            }
            else if (!string.IsNullOrEmpty(tenantId))
            {
                resolvedTenantId = tenantId.ToLower().Trim();
            }

            context.Items["TenantId"] = resolvedTenantId;
            context.Response.Headers.TryAdd("X-Tenant-ID", resolvedTenantId);

            await _next(context);
        }
    }
}
