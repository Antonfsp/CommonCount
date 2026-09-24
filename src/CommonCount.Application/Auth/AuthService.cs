using CommonCount.Application.Auth;
using CommonCount.Application.Common;
using CommonCount.Domain.Entities;

namespace CommonCount.Application.Auth;

public class AuthService
{
   
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public AuthService(IUserRepository userRepository, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<Result<User>> RegisterAsync(RegisterRequest request)
    {
        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            return Result<User>.Fail("This email is already in use.");
        }

        var user = new User
        {
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        await _userRepository.AddAsync(user);

        return Result<User>.Ok(user);
    }

    public async Task<Result<(User User, string Token)>> ValidateLoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);

        if (user is null)
        {
            return Result<(User, string)>.Fail("Incorrect email or password.");
        }

        var isValid = _passwordHasher.VerifyPassword(user, user.PasswordHash, request.Password);

        if (!isValid)
        {
            return Result<(User, string)>.Fail("Incorrect email or password.");
        }

        var token = _tokenService.GenerateToken(user);

        return Result<(User, string)>.Ok((user, token));
    }
}