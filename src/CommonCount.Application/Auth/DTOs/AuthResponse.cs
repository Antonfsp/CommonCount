using System.ComponentModel.DataAnnotations;

namespace CommonCount.Api.Auth;

public class AuthResponse
{
    public int Id { get; set; }

    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}