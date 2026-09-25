using CommonCount.Application.Common;
using CommonCount.Domain.Entities;

namespace CommonCount.Application.Groups;

public class GroupsService
{
    private const string Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private const int InviteCodeLength = 6;
    private readonly IGroupRepository _groupRepository;

    public GroupsService(IGroupRepository groupRepository)
    {
        _groupRepository = groupRepository;
    }

    public async Task<List<Group>> GetGroupsForUserAsync(int userId)
    {
        return await _groupRepository.GetGroupsByUserIdAsync(userId);
    }

    public async Task<Result<Group>> CreateGroupAsync(CreateGroupRequest request, int userId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<Group>.Fail("Group name is required.");
        }

        var group = new Group
        {
            Name = request.Name.Trim(),
            InviteCode = await GenerateUniqueInviteCodeAsync()
        };

        var groupMember = new GroupMember
        {
            DisplayName = "Owner",
            UserId = userId,
            Group = group
        };

        group.Members.Add(groupMember);

        await _groupRepository.AddAsync(group);

        return Result<Group>.Ok(group);
    }

    private async Task<string> GenerateUniqueInviteCodeAsync()
    {
        string inviteCode;
        do
        {
            inviteCode = GenerateRandomInviteCode(Chars, InviteCodeLength);
        } while (await _groupRepository.InviteCodeExistsAsync(inviteCode));

        return inviteCode;
    }

    private string GenerateRandomInviteCode(string chars, int count)
    {
        var random = Random.Shared;
        return new string(Enumerable.Repeat(chars, count)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}