using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CommonCount.Application.Groups;

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
    }
}