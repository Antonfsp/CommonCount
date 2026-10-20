using CommonCount.Application.Common;
using CommonCount.Application.Groups;
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

    public Task<List<Expense>?> GetExpensesForUserAsync(int groupId, int userId)
    {
        return _groupRepository.GetExpensesForUserAsync(groupId, userId);
    }

    public async Task<Result<Expense>?> CreateExpenseForUserAsync(
        int groupId,
        int userId,
        ExpenseRequest request)
    {
        var group = await _groupRepository.GetGroupWithMembersForUserAsync(groupId, userId);
        if (group is null)
        {
            return Result<Expense>.Fail(
                "The user making the request must belong to the group",
                ResultErrorType.NotFound);
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return Result<Expense>.Fail(
                "Expense description is required.",
                ResultErrorType.Validation);
        }

        if (request.Description.Trim().Length > 200)
        {
            return Result<Expense>.Fail(
                "Expense description cannot exceed 200 characters.",
                ResultErrorType.Validation);
        }

        if (request.Amount <= 0 || request.Amount > 99_999_999.99m ||
            decimal.Round(request.Amount, 2) != request.Amount)
        {
            return Result<Expense>.Fail(
                "Expense amount must be positive and have no more than two decimal places.",
                ResultErrorType.Validation);
        }

        var participantMemberIds = request.ParticipantMemberIds;
        if (participantMemberIds is null || participantMemberIds.Count == 0)
        {
            return Result<Expense>.Fail(
                "Select at least one expense participant.",
                ResultErrorType.Validation);
        }

        if (participantMemberIds.Distinct().Count() != participantMemberIds.Count)
        {
            return Result<Expense>.Fail(
                "An expense participant can only be selected once.",
                ResultErrorType.Validation);
        }

        var membersById = group.Members.ToDictionary(member => member.Id);
        if (!membersById.TryGetValue(request.PaidByMemberId, out var paidByMember) ||
            participantMemberIds.Any(memberId => !membersById.ContainsKey(memberId)))
        {
            return Result<Expense>.Fail(
                "The payer and participants must be members of this group.",
                ResultErrorType.Validation);
        }

        var amountInCents = decimal.ToInt64(request.Amount * 100m);
        var baseShareInCents = amountInCents / participantMemberIds.Count;
        var remainderCents = amountInCents % participantMemberIds.Count;
        var expense = new Expense
        {
            Description = request.Description.Trim(),
            Amount = request.Amount,
            Date = DateTime.UtcNow,
            Group = group,
            PaidByMember = paidByMember,
            Participants = participantMemberIds.Select((memberId, index) => new ExpenseParticipant
            {
                Member = membersById[memberId],
                ShareAmount = (baseShareInCents + (index < remainderCents ? 1 : 0)) / 100m
            }).ToList()
        };

        group.Expenses.Add(expense);
        await _groupRepository.SaveChangesAsync();
        return Result<Expense>.Ok(expense);
    }

    public async Task<Result<Expense>> UpdateExpenseForUserAsync(
       int groupId,
       int expenseId,
       int userId,
       ExpenseRequest request)
    {
        var group = await _groupRepository.GetGroupWithMembersForUserAsync(groupId, userId);
        if (group is null)
        {
            return Result<Expense>.Fail(
                "The user making the request must belong to the group",
                ResultErrorType.NotFound);
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return Result<Expense>.Fail(
                "Expense description is required.",
                ResultErrorType.Validation);
        }

        if (request.Description.Trim().Length > 200)
        {
            return Result<Expense>.Fail(
                "Expense description cannot exceed 200 characters.",
                ResultErrorType.Validation);
        }

        if (request.Amount <= 0 || request.Amount > 99_999_999.99m ||
            decimal.Round(request.Amount, 2) != request.Amount)
        {
            return Result<Expense>.Fail(
                "Expense amount must be positive and have no more than two decimal places.",
                ResultErrorType.Validation);
        }

        var participantMemberIds = request.ParticipantMemberIds;
        if (participantMemberIds is null || participantMemberIds.Count == 0)
        {
            return Result<Expense>.Fail(
                "Select at least one expense participant.",
                ResultErrorType.Validation);
        }

        if (participantMemberIds.Distinct().Count() != participantMemberIds.Count)
        {
            return Result<Expense>.Fail(
                "An expense participant can only be selected once.",
                ResultErrorType.Validation);
        }

        var membersById = group.Members.ToDictionary(member => member.Id);
        if (!membersById.TryGetValue(request.PaidByMemberId, out var paidByMember) ||
            participantMemberIds.Any(memberId => !membersById.ContainsKey(memberId)))
        {
            return Result<Expense>.Fail(
                "The payer and participants must be members of this group.",
                ResultErrorType.Validation);
        }

        var desiredMemberIds = participantMemberIds.ToHashSet();

        // Calculating each participant’s share and allocating any remaining cents
        var amountInCents = decimal.ToInt64(request.Amount * 100m);
        var baseShareInCents = amountInCents / participantMemberIds.Count;
        var remainderCents = amountInCents % participantMemberIds.Count;


        var expense = await _groupRepository.GetExpenseByIdAsync(expenseId);

        if (expense is null || expense.GroupId != groupId)
        {
            return Result<Expense>.Fail(
                "The expense doesn't exist",
                ResultErrorType.NotFound);
        }

        expense.Description = request.Description.Trim();
        expense.Amount = request.Amount;
        expense.Group = group;
        expense.PaidByMember = paidByMember;

        foreach (var participant in expense.Participants
                    .Where(p => !participantMemberIds.Contains(p.MemberId))
                    .ToList())
        {
            expense.Participants.Remove(participant);
        }

        for (var index = 0; index < participantMemberIds.Count; index++)
        {
            var memberId = participantMemberIds[index];

            var participant = expense.Participants.FirstOrDefault(p => p.MemberId == memberId);

            if (participant is null)
            {
                participant = new ExpenseParticipant
                {
                    Member = membersById[memberId]
                };
                expense.Participants.Add(participant);
            }

            var shareInCents = baseShareInCents + (index < remainderCents ? 1 : 0);
            participant.ShareAmount = shareInCents / 100m;
        }

        await _groupRepository.SaveChangesAsync();
        return Result<Expense>.Ok(expense);
    }

    public async Task<Result<GroupMember>> AddGroupMemberAsync(
        int groupId,
        int userId,
        AddMemberRequest request)
    {
        // Validates that the user belongs to group
        var group = await _groupRepository.GetGroupWithMembersForUserAsync(groupId, userId);
        if (group is null)
        {
            return Result<GroupMember>.Fail(
                "The user making the request must belong to the group",
                ResultErrorType.NotFound);
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            return Result<GroupMember>.Fail(
                "Member name is required.",
                ResultErrorType.Validation);
        }

        var displayName = request.DisplayName.Trim();
        if (displayName.Length > 80)
        {
            return Result<GroupMember>.Fail(
                "Member name cannot exceed 80 characters.",
                ResultErrorType.Validation);
        }

        if (group.Members.Any(member =>
                string.Equals(member.DisplayName.Trim(), displayName, StringComparison.OrdinalIgnoreCase)))
        {
            return Result<GroupMember>.Fail(
                "A member with this name already exists in the group.",
                ResultErrorType.Conflict);
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

    public async Task<Result<GroupMember>> UpdateGroupMemberAsync(
        int groupMemberId,
        int groupId,
        int userId,
        UpdateGroupMemberRequest request
    )
    {
        // Validates that the user belongs to group
        var group = await _groupRepository.GetGroupWithMembersForUserAsync(groupId, userId);
        if (group is null)
        {
            return Result<GroupMember>.Fail(
                "The user making the request must belong to the group",
                ResultErrorType.NotFound);
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            return Result<GroupMember>.Fail(
                "Member name is required.",
                ResultErrorType.Validation);
        }

        var displayName = request.DisplayName.Trim();
        if (displayName.Length > 80)
        {
            return Result<GroupMember>.Fail(
                "Member name cannot exceed 80 characters.",
                ResultErrorType.Validation);
        }

        var groupMember = group.Members.FirstOrDefault(member => member.Id == groupMemberId);
        if (groupMember is null)
        {
            return Result<GroupMember>.Fail(
                "The group member doesn't exist",
                ResultErrorType.NotFound);
        }
        else if (group.Members.Any(member =>
                member.Id != groupMember.Id &&
                string.Equals(member.DisplayName.Trim(), displayName, StringComparison.OrdinalIgnoreCase)))
        {
            return Result<GroupMember>.Fail(
                "A member with this name already exists in the group.",
                ResultErrorType.Conflict);
        }

        groupMember.DisplayName = displayName;
        await _groupRepository.SaveChangesAsync();

        return Result<GroupMember>.Ok(groupMember);
    }

    public async Task<Result<Group>> CreateGroupAsync(CreateGroupRequest request, int userId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<Group>.Fail("Group name is required.");
        }

        var memberName = string.IsNullOrWhiteSpace(request.MemberName)
            ? "Owner"
            : request.MemberName.Trim();

        if (memberName.Length < 2)
        {
            return Result<Group>.Fail("Your group member name must be at least 2 characters long.");
        }

        if (memberName.Length > 80)
        {
            return Result<Group>.Fail("Your group member name cannot exceed 80 characters.");
        }

        var group = new Group
        {
            Name = request.Name.Trim(),
            InviteCode = await GenerateUniqueInviteCodeAsync()
        };

        var groupMember = new GroupMember
        {
            DisplayName = memberName,
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