using CommonCount.Domain.Entities;

namespace CommonCount.Application.Auth;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email);
    Task AddAsync(User user);
}