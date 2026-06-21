using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using InventoryManagement.Repository.Entities;
using InventoryManagement.Repository.Interfaces;
using InventoryManagement.Service.DTOs;
using InventoryManagement.Service.Helpers;
using InventoryManagement.Service.Interfaces;

namespace InventoryManagement.Service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<Tenant> _tenantRepository;
        private readonly IRepository<TenantSetting> _tenantSettingRepository;
        private readonly IRepository<Role> _roleRepository;
        private readonly IRepository<Category> _categoryRepository;
        private readonly IRepository<Warehouse> _warehouseRepository;
        private readonly IRepository<ActivityLog> _activityLogRepository;
        private readonly IConfiguration _configuration;

        public AuthService(
            IRepository<User> userRepository,
            IRepository<Tenant> tenantRepository,
            IRepository<TenantSetting> tenantSettingRepository,
            IRepository<Role> roleRepository,
            IRepository<Category> categoryRepository,
            IRepository<Warehouse> warehouseRepository,
            IRepository<ActivityLog> activityLogRepository,
            IConfiguration configuration)
        {
            _userRepository = userRepository;
            _tenantRepository = tenantRepository;
            _tenantSettingRepository = tenantSettingRepository;
            _roleRepository = roleRepository;
            _categoryRepository = categoryRepository;
            _warehouseRepository = warehouseRepository;
            _activityLogRepository = activityLogRepository;
            _configuration = configuration;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var tenantIdNormalized = request.TenantId.ToLower().Trim();
            
            var tenant = await _tenantRepository.Query()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == tenantIdNormalized);
                
            if (tenant == null)
            {
                throw new Exception("Tenant workspace not found in database.");
            }

            var user = await _userRepository.Query()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower().Trim() && u.TenantId == tenantIdNormalized);

            if (user == null)
            {
                throw new Exception("User not found under this tenant.");
            }

            if (user.Status != "Active")
            {
                throw new Exception("User account is inactive.");
            }

            if (!PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                throw new Exception("Invalid password.");
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtKey = _configuration["Jwt:Key"] ?? "super_secret_key_long_enough_to_be_secure_256_bits_123456";
            var key = Encoding.ASCII.GetBytes(jwtKey);
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("FirstName", user.FirstName),
                new Claim("LastName", user.LastName),
                new Claim("TenantId", user.TenantId)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["Jwt:Issuer"] ?? "InventoryManagementAPI",
                Audience = _configuration["Jwt:Audience"] ?? "InventoryManagementFrontend"
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            var log = new ActivityLog
            {
                User = $"{user.FirstName} {user.LastName}",
                Action = "Logged in successfully",
                Timestamp = DateTime.UtcNow,
                Type = "success",
                TenantId = user.TenantId
            };
            await _activityLogRepository.AddAsync(log);
            await _activityLogRepository.SaveChangesAsync();

            return new LoginResponse
            {
                AccessToken = tokenString,
                RefreshToken = Guid.NewGuid().ToString(),
                User = new UserDto
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    Role = user.Role,
                    Status = user.Status
                },
                Tenant = new TenantDto
                {
                    Id = tenant.Id,
                    Name = tenant.Name,
                    Logo = tenant.Logo,
                    Email = tenant.Email,
                    Phone = tenant.Phone,
                    Address = tenant.Address
                }
            };
        }

        public async Task<bool> RegisterTenantAsync(RegisterTenantRequest request)
        {
            var tenantIdNormalized = request.TenantId.ToLower().Trim();

            var existingTenant = await _tenantRepository.Query()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == tenantIdNormalized);
                
            if (existingTenant != null)
            {
                throw new Exception($"Tenant workspace with identifier '{request.TenantId}' already exists.");
            }

            var tenant = new Tenant
            {
                Id = tenantIdNormalized,
                Name = request.CompanyName,
                Logo = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop",
                Email = request.Email.ToLower().Trim(),
                Phone = "",
                Address = ""
            };
            await _tenantRepository.AddAsync(tenant);

            var tenantSetting = new TenantSetting
            {
                TenantId = tenantIdNormalized,
                CompanyName = request.CompanyName,
                Logo = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop",
                Email = request.Email.ToLower().Trim(),
                Phone = "",
                Address = "",
                EmailAlerts = true,
                LowStockAlerts = true,
                DailyReports = false
            };
            await _tenantSettingRepository.AddAsync(tenantSetting);

            var adminUser = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email.ToLower().Trim(),
                PasswordHash = PasswordHasher.HashPassword(request.Password),
                Role = "Tenant Admin",
                Status = "Active",
                TenantId = tenantIdNormalized
            };
            await _userRepository.AddAsync(adminUser);

            var category = new Category
            {
                Name = "General",
                Description = "Default category for incoming items",
                TenantId = tenantIdNormalized
            };
            await _categoryRepository.AddAsync(category);

            var warehouse = new Warehouse
            {
                Name = "Main Depot",
                Location = "Headquarters",
                AvailableQty = 0,
                ReservedQty = 0,
                Value = 0,
                TenantId = tenantIdNormalized
            };
            await _warehouseRepository.AddAsync(warehouse);

            var roles = new List<Role>
            {
                new Role
                {
                    Name = "Platform Admin",
                    Description = "Full global system control across all tenants.",
                    PermissionsJson = "[\"all\"]",
                    TenantId = tenantIdNormalized
                },
                new Role
                {
                    Name = "Tenant Admin",
                    Description = "Full control over company account and stock management.",
                    PermissionsJson = "[\"dashboard:read\",\"products:read\",\"products:write\",\"categories:read\",\"categories:write\",\"inventory:read\",\"inventory:write\",\"movements:read\",\"movements:write\",\"users:read\",\"users:write\",\"roles:read\",\"reports:read\",\"settings:read\",\"settings:write\"]",
                    TenantId = tenantIdNormalized
                },
                new Role
                {
                    Name = "Inventory Manager",
                    Description = "Can read/write stock levels and issue movements.",
                    PermissionsJson = "[\"dashboard:read\",\"products:read\",\"products:write\",\"categories:read\",\"categories:write\",\"inventory:read\",\"inventory:write\",\"movements:read\",\"movements:write\",\"reports:read\",\"settings:read\"]",
                    TenantId = tenantIdNormalized
                },
                new Role
                {
                    Name = "Staff",
                    Description = "Can read stock levels and view/record simple stock inputs.",
                    PermissionsJson = "[\"dashboard:read\",\"products:read\",\"categories:read\",\"inventory:read\",\"movements:read\",\"movements:write\"]",
                    TenantId = tenantIdNormalized
                }
            };
            foreach (var role in roles)
            {
                await _roleRepository.AddAsync(role);
            }

            var log = new ActivityLog
            {
                User = $"{request.FirstName} {request.LastName}",
                Action = "Created and initialized tenant workspace",
                Timestamp = DateTime.UtcNow,
                Type = "success",
                TenantId = tenantIdNormalized
            };
            await _activityLogRepository.AddAsync(log);

            await _tenantRepository.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<TenantDto>> GetTenantsAsync()
        {
            var tenants = await _tenantRepository.Query()
                .IgnoreQueryFilters()
                .ToListAsync();

            var list = new List<TenantDto>();
            foreach (var t in tenants)
            {
                list.Add(new TenantDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Logo = t.Logo,
                    Email = t.Email,
                    Phone = t.Phone,
                    Address = t.Address
                });
            }
            return list;
        }

        public async Task<LoginResponse?> RefreshSessionAsync(RefreshRequest request)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtKey = _configuration["Jwt:Key"] ?? "super_secret_key_long_enough_to_be_secure_256_bits_123456";
                var key = Encoding.ASCII.GetBytes(jwtKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"] ?? "InventoryManagementAPI",
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"] ?? "InventoryManagementFrontend",
                    ValidateLifetime = false,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(request.AccessToken, validationParameters, out var validatedToken);
                
                var userIdStr = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var tenantId = principal.FindFirst("TenantId")?.Value;

                if (string.IsNullOrEmpty(userIdStr) || string.IsNullOrEmpty(tenantId) || !int.TryParse(userIdStr, out var userId))
                {
                    return null;
                }

                var tenant = await _tenantRepository.Query()
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(t => t.Id == tenantId);

                if (tenant == null) return null;

                var user = await _userRepository.Query()
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId);

                if (user == null || user.Status != "Active") return null;

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role),
                    new Claim("FirstName", user.FirstName),
                    new Claim("LastName", user.LastName),
                    new Claim("TenantId", user.TenantId)
                };

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = DateTime.UtcNow.AddDays(7),
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                    Issuer = _configuration["Jwt:Issuer"] ?? "InventoryManagementAPI",
                    Audience = _configuration["Jwt:Audience"] ?? "InventoryManagementFrontend"
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = tokenHandler.WriteToken(token);

                return new LoginResponse
                {
                    AccessToken = tokenString,
                    RefreshToken = Guid.NewGuid().ToString(),
                    User = new UserDto
                    {
                        Id = user.Id,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Email = user.Email,
                        Role = user.Role,
                        Status = user.Status
                    },
                    Tenant = new TenantDto
                    {
                        Id = tenant.Id,
                        Name = tenant.Name,
                        Logo = tenant.Logo,
                        Email = tenant.Email,
                        Phone = tenant.Phone,
                        Address = tenant.Address
                    }
                };
            }
            catch
            {
                return null;
            }
        }
    }
}
