using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CommonCount.Application.Common;
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
                return result.ErrorType switch
                {
                    ResultErrorType.Validation =>
                        Results.BadRequest(new { message = result.Error }),

                    ResultErrorType.Conflict =>
                        Results.Conflict(new { message = result.Error }),

                    ResultErrorType.NotFound =>
                        Results.NotFound(new { message = result.Error }),

                    _ => Results.Problem("An unexpected error occurred.")
                };
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
                return result.ErrorType switch
                {
                    ResultErrorType.Validation =>
                        Results.BadRequest(new { message = result.Error }),

                    ResultErrorType.Conflict =>
                        Results.Conflict(new { message = result.Error }),

                    ResultErrorType.NotFound =>
                        Results.NotFound(new { message = result.Error }),

                    _ => Results.Problem("An unexpected error occurred.")
                };
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


            return Results.Ok(members.Select(member => new UpdateGroupMemberResponse
            {
                Id = member.Id,
                UserId = member.UserId,
                DisplayName = member.DisplayName,
                JoinedAt = member.JoinedAt
            }));
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
                    return result.ErrorType switch
                    {
                        ResultErrorType.Validation =>
                        Results.BadRequest(new { message = result.Error }),

                        ResultErrorType.Conflict =>
                        Results.Conflict(new { message = result.Error }),

                        ResultErrorType.NotFound =>
                        Results.NotFound(new { message = result.Error }),

                        _ => Results.Problem("An unexpected error occurred.")
                    };
                }

                var member = result.Value!;

                var response = new UpdateGroupMemberResponse
                {
                    Id = member.Id,
                    UserId = member.UserId,
                    DisplayName = member.DisplayName,
                    JoinedAt = member.JoinedAt
                };

                return Results.Created(
                $"/api/groups/{groupId}/members/{member.Id}",
                response);
            }).WithName("Add group member");

        groupGroup.MapPut("{groupId:int}/members/{memberId:int}", async (
            int groupId,
            int memberId,
            UpdateGroupMemberRequest request,
            ClaimsPrincipal user,
            GroupsService groupsService) =>
        {
            var userIdClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var result = await groupsService.UpdateGroupMemberAsync(memberId, groupId, userId, request);

            if (!result.IsSuccess)
            {
                return result.ErrorType switch
                {
                    ResultErrorType.Validation =>
                        Results.BadRequest(new { message = result.Error }),

                    ResultErrorType.Conflict =>
                        Results.Conflict(new { message = result.Error }),

                    ResultErrorType.NotFound =>
                        Results.NotFound(new { message = result.Error }),

                    _ => Results.Problem("An unexpected error occurred.")
                };
            }

            var member = result.Value!;

            var memberResponse = new UpdateGroupMemberResponse
            {
                Id = member.Id,
                UserId = member.UserId,
                DisplayName = member.DisplayName,
                JoinedAt = member.JoinedAt
            };

            return Results.Ok(memberResponse);

        }).WithName("Update group member name");
    }

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