using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using CommonCount.Api.Groups;
using CommonCount.Application.Groups;
using CommonCount.Domain.Entities;
using CommonCount.Infrastructure.Data;
using CommonCount.Infrastructure.Groups;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Xunit;
namespace CommonCount.Api.IntegrationTests;

public sealed class GroupMemberUpdateTests : IAsyncLifetime
{
    private const int GroupMemberUserId = 42;
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private WebApplication _app = null!;
    private HttpClient _client = null!;


    [Fact]
    public async Task GroupMemberCanRenameMember()
    {
        using var request = AuthenticatedRequest(
            HttpMethod.Put,
            "api/Groups/1/members/6"
        );

        request.Content = JsonContent.Create(new
        {
            displayName = " Alex Smith "
        });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updatedMember = await response.Content.ReadFromJsonAsync<UpdateGroupMemberResponse>();
        Assert.NotNull(updatedMember);
        Assert.Equal(6, updatedMember.Id);
        Assert.Equal("Alex Smith", updatedMember.DisplayName);

        using var listRequest = AuthenticatedRequest(
       HttpMethod.Get,
       "/api/groups/1/members");

        var listResponse = await _client.SendAsync(listRequest);
        var members = await listResponse.Content.ReadFromJsonAsync<List<UpdateGroupMemberResponse>>();

        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        Assert.NotNull(members);
        Assert.Contains(members, member =>
            member.Id == 6 && member.DisplayName == "Alex Smith");
    }

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();

        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        builder.Services.AddScoped<IGroupRepository, GroupRepository>();
        builder.Services.AddScoped<GroupsService>();
        builder.Services
            .AddAuthentication("Test")
            .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", _ => { });
        builder.Services.AddAuthorization();

        _app = builder.Build();
        _app.UseAuthentication();
        _app.UseAuthorization();
        _app.MapGroupsEndppoints();
        await _app.StartAsync();
        _client = _app.GetTestClient();

        await using var scope = _app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
        await SeedGroupsAsync(db);
    }

    private static async Task SeedGroupsAsync(AppDbContext db)
    {
        var owner = new User
        {
            Id = GroupMemberUserId,
            Email = "owner@example.test",
            PasswordHash = "hash",
            DisplayName = "Owner"
        };

        var group = new Group
        {
            Id = 1,
            Name = "Trip",
            InviteCode = "TRIP01",
            Members =
            [
                new GroupMember
                {
                    Id = 1,
                    DisplayName = "Owner",
                    UserId = GroupMemberUserId,
                    User = owner
                },
                new GroupMember { Id = 6, DisplayName = "Alex" },
                new GroupMember { Id = 7, DisplayName = "Sam" },
                new GroupMember { Id = 8, DisplayName = "Jordan" }
            ]
        };
        var otherGroup = new Group
        {
            Id = 2,
            Name = "Other",
            InviteCode = "OTHER1",
            Members = [new GroupMember { Id = 2, DisplayName = "Other member" }]
        };

        var emptyGroup = new Group
        {
            Id = 3,
            Name = "Empty",
            InviteCode = "EMPTY1",
        };

        db.Groups.AddRange(group, otherGroup, emptyGroup);
        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _app.DisposeAsync();
        await _connection.DisposeAsync();
    }

    private sealed class TestAuthenticationHandler(
       IOptionsMonitor<AuthenticationSchemeOptions> options,
       ILoggerFactory logger,
       UrlEncoder encoder)
       : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.TryGetValue("X-User-Id", out var userId))
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            var identity = new ClaimsIdentity(
                [new Claim(JwtRegisteredClaimNames.Sub, userId.ToString())],
                Scheme.Name);
            var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }
    private static HttpRequestMessage AuthenticatedRequest(
    HttpMethod method,
    string uri,
    int userId = GroupMemberUserId)
    {
        var request = new HttpRequestMessage(method, uri);
        request.Headers.Add("X-User-Id", userId.ToString());
        return request;
    }
}