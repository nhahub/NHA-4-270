using Microsoft.EntityFrameworkCore;
using InventoryManagement.Repository.Entities;
using InventoryManagement.Repository.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace InventoryManagement.Repository.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly ITenantProvider _tenantProvider;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantProvider tenantProvider)
            : base(options)
        {
            _tenantProvider = tenantProvider;
        }

        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<TenantSetting> TenantSettings { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<StockMovement> StockMovements { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Global Query Filters for multi-tenancy
            modelBuilder.Entity<Category>().HasQueryFilter(e => e.TenantId == _tenantProvider.TenantId);
            modelBuilder.Entity<Product>().HasQueryFilter(e => e.TenantId == _tenantProvider.TenantId);
            modelBuilder.Entity<Warehouse>().HasQueryFilter(e => e.TenantId == _tenantProvider.TenantId);
            modelBuilder.Entity<StockMovement>().HasQueryFilter(e => e.TenantId == _tenantProvider.TenantId);
            modelBuilder.Entity<User>().HasQueryFilter(e => e.TenantId == _tenantProvider.TenantId);
            modelBuilder.Entity<Role>().HasQueryFilter(e => e.TenantId == _tenantProvider.TenantId);
            modelBuilder.Entity<ActivityLog>().HasQueryFilter(e => e.TenantId == _tenantProvider.TenantId);
            modelBuilder.Entity<TenantSetting>().HasQueryFilter(e => e.TenantId == _tenantProvider.TenantId);

            // Configure compound relationships or key configurations if needed
            modelBuilder.Entity<TenantSetting>()
                .HasOne(ts => ts.Tenant)
                .WithOne(t => t.Setting)
                .HasForeignKey<TenantSetting>(ts => ts.TenantId);

            // Configure Product category relation
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure StockMovement relations
            modelBuilder.Entity<StockMovement>()
                .HasOne(sm => sm.Product)
                .WithMany(p => p.StockMovements)
                .HasForeignKey(sm => sm.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StockMovement>()
                .HasOne(sm => sm.Tenant)
                .WithMany(t => t.StockMovements)
                .HasForeignKey(sm => sm.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
        }

        public override int SaveChanges()
        {
            SetTenantId();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SetTenantId();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void SetTenantId()
        {
            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State == EntityState.Added)
                {
                    var tenantIdProp = entry.Entity.GetType().GetProperty("TenantId");
                    if (tenantIdProp != null && tenantIdProp.PropertyType == typeof(string))
                    {
                        var currentValue = (string?)tenantIdProp.GetValue(entry.Entity);
                        if (string.IsNullOrEmpty(currentValue))
                        {
                            tenantIdProp.SetValue(entry.Entity, _tenantProvider.TenantId);
                        }
                    }
                }
            }
        }
    }
}
