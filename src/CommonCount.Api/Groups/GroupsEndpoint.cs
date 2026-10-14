using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CommonCount.Application.Groups;
using CommonCount.Domain.Entities;

namespace CommonCount.Api.Groups;

public static class GroupsEndpoint
{
    public static void MapGroupsEndppoints(this WebApplication app)
    {
        var groupGroup = app.MapGroup("/api/groups").RequireAuthorization();

        groupGroup.MapGet("/", async (ClaimsPrincipal user, GroupsService groupsService) =>
        {
            var userIdClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var groups = await groupsService.GetGroupsForUserAsync(userId);
            return Results.Ok(groups.Select(group => new
            {
                id = group.Id,
                name = group.Name,
                inviteCode = group.InviteCode,
                createdAt = group.CreatedAt
            }));
        }).WithName("Get my groups");

        groupGroup.MapPost("/create", async (CreateGroupRequest request, ClaimsPrincipal user, GroupsService groupsService) =>
        {
            var userIdClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var result = await groupsService.CreateGroupAsync(request, userId);

            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { message = result.Error });
            }

            var response = new CreateGroupResponse
            {
                Id = result.Value!.Id,
                Name = result.Value.Name,
                InviteCode = result.Value.InviteCode
            };

            return Results.Created($"/api/groups/{result.Value!.Id}", response);
        }).WithName("Create group");

        groupGroup.MapGet("/{groupId:int}/expenses", async (
            int groupId,
            ClaimsPrincipal user,
            GroupsService groupsService) =>
        {
            var userIdClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var expenses = await groupsService.GetExpensesForUserAsync(groupId, userId);
            if (expenses is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(expenses.Select(ToExpenseResponse));
        }).WithName("Get group expenses");

        groupGroup.MapPost("/{groupId:int}/expenses", async (
            int groupId,
            CreateExpenseRequest request,
            ClaimsPrincipal user,
            GroupsService groupsService) =>
        {
            var userIdClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var result = await groupsService.CreateExpenseForUserAsync(groupId, userId, request);
            if (result is null)
            {
                return Results.NotFound();
            }

            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { message = result.Error });
            }

            var expense = result.Value!;
            return Results.Created(
                $"/api/groups/{groupId}/expenses/{expense.Id}",
                ToExpenseResponse(expense));
        }).WithName("Create group expense");

        groupGroup.MapGet("/{groupId:int}/members", async (
            int groupId,
            ClaimsPrincipal user,
            GroupsService groupsService) =>
        {
            var userIdClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var members = await groupsService.GetGroupMembersForUserAsync(groupId, userId);
            if (members is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(members.Select(ToMemberResponse));
        }).WithName("Get group members");

        groupGroup.MapPost("/{groupId:int}/members", async (
            int groupId,
            AddMemberRequest request,
            ClaimsPrincipal user,
            GroupsService groupsService) =>
        {
            var userIdClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var result = await groupsService.AddGroupMemberAsync(groupId, userId, request);
            if (result is null)
            {
                return Results.NotFound();
            }

            if (!result.IsSuccess)
            {
                return Results.Conflict(new { message = result.Error });
            }

            var member = result.Value!;
            return Results.Created(
                $"/api/groups/{groupId}/members/{member.Id}",
                ToMemberResponse(member));
        }).WithName("Add group member");
    }

    private static object ToMemberResponse(CommonCount.Domain.Entities.GroupMember member) => new
    {
        id = member.Id,
        userId = member.UserId,
        name = member.DisplayName,
        joinedAt = member.JoinedAt
    };

    private static object ToExpenseResponse(Expense expense) => new
    {
        id = expense.Id,
        description = expense.Description,
        amount = expense.Amount,
        date = DateTime.SpecifyKind(expense.Date, DateTimeKind.Utc),
        paidByMember = new
        {
            id = expense.PaidByMember.Id,
            name = expense.PaidByMember.DisplayName
        },
        participants = expense.Participants.Select(participant => new
        {
            memberId = participant.MemberId,
            shareAmount = participant.ShareAmount
        })
    };
}