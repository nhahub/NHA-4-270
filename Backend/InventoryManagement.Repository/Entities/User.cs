using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryManagement.Repository.Entities
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = string.Empty; // Tenant Admin, Platform Admin, etc.

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Active"; // Active, Inactive

        [Required]
        [MaxLength(50)]
        [ForeignKey("Tenant")]
        public string TenantId { get; set; } = string.Empty;

        // Navigation properties
        public virtual Tenant? Tenant { get; set; }
    }
}
