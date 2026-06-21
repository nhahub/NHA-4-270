using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryManagement.Repository.Entities
{
    public class Category
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [ForeignKey("Tenant")]
        public string TenantId { get; set; } = string.Empty;

        // Navigation properties
        public virtual Tenant? Tenant { get; set; }
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
