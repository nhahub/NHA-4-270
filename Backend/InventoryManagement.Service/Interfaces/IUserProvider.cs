namespace InventoryManagement.Service.Interfaces
{
    public interface IUserProvider
    {
        string CurrentUserEmail { get; }
        string CurrentUserName { get; }
        string CurrentUserRole { get; }
    }
}
