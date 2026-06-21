using System;

namespace InventoryManagement.Service.DTOs
{
    public class CategoryDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class ProductDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public int CategoryId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
    }

    public class StockMovementDto
    {
        public int? Id { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public string MovementType { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Reference { get; set; } = string.Empty;
        public DateTime MovementDate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public string? FromWarehouse { get; set; }
        public string? ToWarehouse { get; set; }
    }

    public class WarehouseDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int AvailableQty { get; set; }
        public int ReservedQty { get; set; }
        public decimal Value { get; set; }
    }

    public class RoleDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string[] Permissions { get; set; } = Array.Empty<string>();
    }

    public class ActivityLogDto
    {
        public int? Id { get; set; }
        public string User { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Type { get; set; } = "info"; // info, success, warning, danger
    }

    public class CompanySettingsDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string Logo { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }

    public class UserProfileSettingsDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class NotificationSettingsDto
    {
        public bool EmailAlerts { get; set; }
        public bool LowStockAlerts { get; set; }
        public bool DailyReports { get; set; }
    }

    public class AppSettingsDto
    {
        public CompanySettingsDto Company { get; set; } = new();
        public UserProfileSettingsDto Profile { get; set; } = new();
        public NotificationSettingsDto Notifications { get; set; } = new();
    }
}
