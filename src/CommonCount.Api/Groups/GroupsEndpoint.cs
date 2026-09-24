using CommonCount.Application.Groups;

namespace CommonCount.Api.Groups;

public static class GroupsEndpoint
{
    public static void MapGroupsEndppoints(this WebApplication app)
    {
        var groupGroup = app.MapGroup("/api/groups").RequireAuthorization();

        groupGroup.MapPost(("/create"), async (CreateGroupRequest request, GroupsService groupsService) =>
        {
            var result = await groupsService.CreateGroupAsync(request);

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


            return Results.Created($"/api/groups/{result.Value!.Id}",response);

        }).WithName("Create group");
    }
}