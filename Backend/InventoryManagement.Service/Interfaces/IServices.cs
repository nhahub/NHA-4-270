using System.Collections.Generic;
using System.Threading.Tasks;
using InventoryManagement.Service.DTOs;

namespace InventoryManagement.Service.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse?> LoginAsync(LoginRequest request);
        Task<bool> RegisterTenantAsync(RegisterTenantRequest request);
        Task<IEnumerable<TenantDto>> GetTenantsAsync();
        Task<LoginResponse?> RefreshSessionAsync(RefreshRequest request);
    }

    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetProductsAsync();
        Task<ProductDto?> GetProductByIdAsync(int id);
        Task<ProductDto> SaveProductAsync(ProductDto dto);
        Task<bool> DeleteProductAsync(int id);
    }

    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetCategoriesAsync();
        Task<CategoryDto> SaveCategoryAsync(CategoryDto dto);
        Task<bool> DeleteCategoryAsync(int id);
    }

    public interface IStockMovementService
    {
        Task<IEnumerable<StockMovementDto>> GetStockMovementsAsync();
        Task<StockMovementDto> CreateStockMovementAsync(StockMovementDto dto);
    }

    public interface IWarehouseService
    {
        Task<IEnumerable<WarehouseDto>> GetWarehousesAsync();
        Task<WarehouseDto> SaveWarehouseAsync(WarehouseDto dto);
        Task<bool> DeleteWarehouseAsync(int id);
    }

    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetUsersAsync();
        Task<UserDto> SaveUserAsync(UserDto dto);
        Task<bool> DeleteUserAsync(int id);
    }

    public interface IRoleService
    {
        Task<IEnumerable<RoleDto>> GetRolesAsync();
        Task<RoleDto> SaveRoleAsync(RoleDto dto);
    }

    public interface ISettingsService
    {
        Task<AppSettingsDto> GetSettingsAsync();
        Task<AppSettingsDto> SaveSettingsAsync(AppSettingsDto dto);
    }

    public interface IDashboardService
    {
        Task<object> GetDashboardStatsAsync();
        Task<IEnumerable<ActivityLogDto>> GetActivityLogsAsync();
        Task LogActivityAsync(string action, string type);
    }
}
