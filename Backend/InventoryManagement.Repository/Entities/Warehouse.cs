using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryManagement.Repository.Entities
{
    public class Warehouse
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(250)]
        public string Location { get; set; } = string.Empty;

        public int AvailableQty { get; set; }
        public int ReservedQty { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Value { get; set; }

        [Required]
        [MaxLength(50)]
        [ForeignKey("Tenant")]
        public string TenantId { get; set; } = string.Empty;

        // Navigation properties
        public virtual Tenant? Tenant { get; set; }
    }
}
