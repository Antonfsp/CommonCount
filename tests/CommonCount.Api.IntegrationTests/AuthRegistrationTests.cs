using System.Net;
using System.Net.Http.Json;
using CommonCount.Application.Auth;
using CommonCount.Api.Auth;
using CommonCount.Infrastructure.Auth;
using CommonCount.Infrastructure.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CommonCount.Api.IntegrationTests;

public sealed class AuthRegistrationTests : IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private WebApplication _app = null!;
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();

        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        builder.Services.AddScoped<IUserRepository, UserRepository>();
        builder.Services.AddScoped<IPasswordHasher, PasswordHasherService>();
        builder.Services.AddScoped<ITokenService, TokenService>();
        builder.Services.AddScoped<AuthService>();

        _app = builder.Build();
        _app.MapAuthEndpoints();
        await _app.StartAsync();
        _client = _app.GetTestClient();

        await using var scope = _app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _app.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t\r\n")]
    public async Task RegistrationRejectsBlankProfileNames(string displayName)
    {
        const string email = "person@example.test";
        var response = await RegisterAsync(new
        {
            email,
            password = "password",
            displayName
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Profile name is required.", await response.Content.ReadAsStringAsync());

        var retryResponse = await RegisterAsync(new
        {
            email,
            password = "password",
            displayName = "Alex"
        });

        Assert.Equal(HttpStatusCode.Created, retryResponse.StatusCode);
    }

    [Fact]
    public async Task RegistrationRejectsMissingProfileName()
    {
        var response = await RegisterAsync(new
        {
            email = "person@example.test",
            password = "password"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Profile name is required.", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task RegistrationTrimsProfileNameBeforeReturningCreatedAccount()
    {
        var response = await RegisterAsync(new
        {
            email = "person@example.test",
            password = "password",
            displayName = "  Alex Smith  "
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var createdAccount = await response.Content.ReadFromJsonAsync<RegistrationResponse>();
        Assert.NotNull(createdAccount);
        Assert.Equal("Alex Smith", createdAccount.DisplayName);
    }

    private Task<HttpResponseMessage> RegisterAsync(object request)
        => _client.PostAsJsonAsync("/api/auth/register", request);

    private sealed class RegistrationResponse
    {
        public string DisplayName { get; init; } = string.Empty;
    }
}
