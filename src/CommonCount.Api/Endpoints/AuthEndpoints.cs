using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CommonCount.Api.DTOs;
using CommonCount.Api.Services;
using Microsoft.AspNetCore.SignalR.Protocol;

namespace CommonCount.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var authGroup = app.MapGroup("/api/auth");

        authGroup.MapPost("/register", async (RegisterRequest request, AuthService authService) =>
        {
            var result = await authService.RegisterAsync(request);

            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { message = result.Error });
            }

            var response = new AuthReponse
            {
                Id = result.Value!.Id,
                Email = result.Value.Email,
                DisplayName = result.Value.DisplayName
            };

            return Results.Created($"/apli/users/{result.Value.Id}", response);
        })
        .WithName("Register");


        authGroup.MapPost("/login", async (LoginRequest request, AuthService authService) =>
        {
            var result = await authService.ValidateLoginAsync(request);

            if (!result.IsSuccess)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(new
            {
                token = result.Value.Token,
                userId = result.Value.User.Id,
                email = result.Value.User.Email
            });
        })
        .WithName("Login");

        authGroup.MapGet("/me", (ClaimsPrincipal user) =>
        {
            var userId = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            var email = user.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
            return Results.Ok(new { userId, email });
        })
        .RequireAuthorization()
        .WithName("Me");
    }
}