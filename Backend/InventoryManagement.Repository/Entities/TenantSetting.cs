using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryManagement.Repository.Entities
{
    public class TenantSetting
    {
        [Key]
        [Required]
        [ForeignKey("Tenant")]
        [MaxLength(50)]
        public string TenantId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Logo { get; set; } = string.Empty;

        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Phone { get; set; } = string.Empty;

        [MaxLength(250)]
        public string Address { get; set; } = string.Empty;

        public bool EmailAlerts { get; set; }
        public bool LowStockAlerts { get; set; }
        public bool DailyReports { get; set; }

        // Navigation properties
        public virtual Tenant? Tenant { get; set; }
    }
}
