using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryManagement.Repository.Entities
{
    public class StockMovement
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        [MaxLength(50)]
        public string MovementType { get; set; } = string.Empty; // STOCK_IN, STOCK_OUT, TRANSFER

        public int Quantity { get; set; }

        [Required]
        [MaxLength(100)]
        public string Reference { get; set; } = string.Empty;

        public DateTime MovementDate { get; set; } = DateTime.UtcNow;

        [MaxLength(1000)]
        public string Notes { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? FromWarehouse { get; set; }

        [MaxLength(100)]
        public string? ToWarehouse { get; set; }

        [Required]
        [MaxLength(50)]
        [ForeignKey("Tenant")]
        public string TenantId { get; set; } = string.Empty;

        // Navigation properties
        public virtual Tenant? Tenant { get; set; }
        public virtual Product? Product { get; set; }
    }
}
