using CommonCount.Domain.Entities;

namespace CommonCount.Application.Groups;

public interface IGroupRepository
{
    Task<Group?> GetByIdAsync(int groupId);
    Task<Group?> GetByInviteCodeAsync(string inviteCode);
    Task<List<Group>> GetGroupsByUserIdAsync(int userId);
    Task<bool> InviteCodeExistsAsync(string inviteCode);

    Task AddAsync(Group group);
    Task SaveChangesAsync();
}