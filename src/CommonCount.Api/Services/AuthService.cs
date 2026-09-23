using CommonCount.Api.Common;
using CommonCount.Api.Data;
using CommonCount.Api.DTOs;
using CommonCount.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CommonCount.Api.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly TokenService _tokenService;

    public AuthService(AppDbContext db, TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<Result<User>> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
        {
            return Result<User>.Fail("This email is already in use.");
        }

        var user = new User
        {
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Result<User>.Ok(user);
    }

    public async Task<Result<(User User, string Token)>> ValidateLoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null)
        {
            return Result<(User, string)>.Fail("Incorrect email or password.");
        }

        var passwordVerificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (passwordVerificationResult == PasswordVerificationResult.Failed)
        {
            return Result<(User, string)>.Fail("Incorrect email or password.");
        }

        var token = _tokenService.GenerateToken(user);

        return Result<(User, string)>.Ok((user, token));
    }
}