using CommonCount.Domain.Entities;

namespace CommonCount.Application.Auth;

public interface ITokenService
{
    string GenerateToken(User user);
}