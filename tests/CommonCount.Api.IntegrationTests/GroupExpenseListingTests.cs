using System.IdentityModel.Tokens.Jwt;
using System.Globalization;
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
using Xunit;

namespace CommonCount.Api.IntegrationTests;

public sealed class GroupExpenseListingTests : IAsyncLifetime
{
    private const int GroupMemberUserId = 42;
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private WebApplication _app = null!;
    private HttpClient _client = null!;

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

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _app.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task GroupMemberGetsOnlyTheirGroupsExpensesInExpectedOrder()
    {
        using var request = AuthenticatedRequest(HttpMethod.Get, "/api/groups/1/expenses");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var expenses = await response.Content.ReadFromJsonAsync<List<ExpenseResponse>>();
        Assert.NotNull(expenses);
        Assert.Equal(["Newest", "Alpha", "Zulu", "Older"], expenses.Select(expense => expense.Description));
        Assert.Equal(4, expenses[0].Amount);
        Assert.Equal(new DateTime(2026, 10, 15, 8, 0, 0, DateTimeKind.Utc), expenses[0].Date);
        Assert.All(expenses, expense => Assert.Equal("Owner", expense.PaidByMember.Name));
        Assert.All(expenses, expense => Assert.Equal(1, expense.PaidByMember.Id));
        Assert.DoesNotContain(expenses, expense => expense.Description == "Other group expense");
    }

    [Fact]
    public async Task NonMemberCannotReadGroupExpenses()
    {
        using var request = AuthenticatedRequest(HttpMethod.Get, "/api/groups/1/expenses", userId: 99);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ExpenseListRequiresAuthentication()
    {
        var response = await _client.GetAsync("/api/groups/1/expenses");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GroupMemberReceivesEmptyListWhenGroupHasNoExpenses()
    {
        using var request = AuthenticatedRequest(HttpMethod.Get, "/api/groups/3/expenses");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty(await response.Content.ReadFromJsonAsync<List<ExpenseResponse>>() ?? []);
    }

    [Fact]
    public async Task GroupMemberCanCreateExpenseWithEqualSharesAndRemainderCents()
    {
        using var request = AuthenticatedRequest(HttpMethod.Post, "/api/groups/1/expenses");
        request.Content = JsonContent.Create(new
        {
            description = "Dinner",
            amount = 10.01m,
            paidByMemberId = 1,
            participantMemberIds = new[] { 8, 6, 7 }
        });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var createdExpense = await response.Content.ReadFromJsonAsync<ExpenseResponse>();
        Assert.NotNull(createdExpense);
        Assert.Equal("Dinner", createdExpense.Description);
        Assert.Equal(10.01m, createdExpense.Amount);
        Assert.Equal("Owner", createdExpense.PaidByMember.Name);
        Assert.InRange(createdExpense.Date, DateTime.UtcNow.AddMinutes(-1), DateTime.UtcNow.AddMinutes(1));

        using var listRequest = AuthenticatedRequest(HttpMethod.Get, "/api/groups/1/expenses");
        var listResponse = await _client.SendAsync(listRequest);
        var expenses = await listResponse.Content.ReadFromJsonAsync<List<ExpenseResponse>>();

        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        Assert.NotNull(expenses);
        var savedExpense = Assert.Single(expenses, expense => expense.Description == "Dinner");
        Assert.Equal(
            new[] { (8, 3.34m), (6, 3.34m), (7, 3.33m) },
            savedExpense.Participants.Select(participant => (participant.MemberId, participant.ShareAmount)));
    }

    [Fact]
    public async Task ExpenseCreationRequiresAuthentication()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/groups/1/expenses")
        {
            Content = JsonContent.Create(ValidExpenseRequest())
        };

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task NonMemberCannotCreateExpenseForAGroup()
    {
        using var request = AuthenticatedRequest(
            HttpMethod.Post,
            "/api/groups/1/expenses",
            userId: 99);
        request.Content = JsonContent.Create(ValidExpenseRequest());

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-0.01")]
    [InlineData("10.001")]
    [InlineData("100000000.00")]
    public async Task ExpenseAmountMustBePositiveAndHaveAtMostTwoDecimalPlaces(string amountText)
    {
        using var request = AuthenticatedRequest(HttpMethod.Post, "/api/groups/1/expenses");
        request.Content = JsonContent.Create(new
        {
            description = "Invalid amount",
            amount = decimal.Parse(amountText, CultureInfo.InvariantCulture),
            paidByMemberId = 1,
            participantMemberIds = new[] { 6 }
        });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData(2, 6)]
    [InlineData(1, 2)]
    public async Task ExpensePayerAndParticipantsMustBelongToTheGroup(
        int paidByMemberId,
        int participantMemberId)
    {
        using var request = AuthenticatedRequest(HttpMethod.Post, "/api/groups/1/expenses");
        request.Content = JsonContent.Create(new
        {
            description = "Dinner",
            amount = 10m,
            paidByMemberId,
            participantMemberIds = new[] { participantMemberId }
        });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ExpenseRequiresAtLeastOneParticipant()
    {
        using var request = AuthenticatedRequest(HttpMethod.Post, "/api/groups/1/expenses");
        request.Content = JsonContent.Create(new
        {
            description = "Dinner",
            amount = 10m,
            paidByMemberId = 1,
            participantMemberIds = Array.Empty<int>()
        });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static object ValidExpenseRequest() => new
    {
        description = "Dinner",
        amount = 10m,
        paidByMemberId = 1,
        participantMemberIds = new[] { 6 }
    };

    private static HttpRequestMessage AuthenticatedRequest(
        HttpMethod method,
        string uri,
        int userId = GroupMemberUserId)
    {
        var request = new HttpRequestMessage(method, uri);
        request.Headers.Add("X-User-Id", userId.ToString());
        return request;
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
            Members =
            [
                new GroupMember
                {
                    Id = 3,
                    DisplayName = "Owner",
                    UserId = GroupMemberUserId,
                    User = owner
                }
            ]
        };

        group.Expenses =
        [
            NewExpense(1, "Older", 12, new DateTime(2026, 10, 13, 8, 0, 0, DateTimeKind.Utc)),
            NewExpense(2, "Zulu", 9, new DateTime(2026, 10, 14, 8, 0, 0, DateTimeKind.Utc)),
            NewExpense(3, "Alpha", 7, new DateTime(2026, 10, 14, 8, 0, 0, DateTimeKind.Utc)),
            NewExpense(4, "Newest", 4, new DateTime(2026, 10, 15, 8, 0, 0, DateTimeKind.Utc))
        ];
        otherGroup.Expenses =
        [
            new Expense
            {
                Id = 5,
                Description = "Other group expense",
                Amount = 50,
                Date = new DateTime(2026, 10, 15, 9, 0, 0, DateTimeKind.Utc),
                PaidByMemberId = 2,
                PaidByMember = otherGroup.Members.Single()
            }
        ];

        db.Groups.AddRange(group, otherGroup, emptyGroup);
        await db.SaveChangesAsync();
    }

    private static Expense NewExpense(int id, string description, decimal amount, DateTime date)
    {
        return new Expense
        {
            Id = id,
            Description = description,
            Amount = amount,
            Date = date,
            PaidByMemberId = 1
        };
    }

    private sealed class ExpenseResponse
    {
        public string Description { get; init; } = string.Empty;
        public decimal Amount { get; init; }
        public DateTime Date { get; init; }
        public MemberResponse PaidByMember { get; init; } = new();
        public List<ParticipantResponse> Participants { get; init; } = [];
    }

    private sealed class MemberResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = string.Empty;
    }

    private sealed class ParticipantResponse
    {
        public int MemberId { get; init; }
        public decimal ShareAmount { get; init; }
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
}
