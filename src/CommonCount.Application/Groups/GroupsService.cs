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

    public async Task<List<GroupMember>?> GetGroupMembersForUserAsync(int groupId, int userId)
    {
        var group = await _groupRepository.GetGroupWithMembersForUserAsync(groupId, userId);
        return group?.Members.OrderBy(member => member.Id).ToList();
    }

    public async Task<Result<GroupMember>?> AddGroupMemberAsync(
        int groupId,
        int userId,
        AddMemberRequest request)
    {
        var group = await _groupRepository.GetGroupWithMembersForUserAsync(groupId, userId);
        if (group is null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            return Result<GroupMember>.Fail("Member name is required.");
        }

        var displayName = request.DisplayName.Trim();
        if (displayName.Length > 80)
        {
            return Result<GroupMember>.Fail("Member name cannot exceed 80 characters.");
        }

        if (group.Members.Any(member =>
                string.Equals(member.DisplayName.Trim(), displayName, StringComparison.OrdinalIgnoreCase)))
        {
            return Result<GroupMember>.Fail("A member with this name already exists in the group.");
        }

        var groupMember = new GroupMember
        {
            DisplayName = displayName,
            Group = group
        };

        group.Members.Add(groupMember);
        await _groupRepository.SaveChangesAsync();

        return Result<GroupMember>.Ok(groupMember);
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