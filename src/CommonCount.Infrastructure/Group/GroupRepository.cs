using CommonCount.Application.Groups;
using CommonCount.Infrastructure.Data;
using CommonCount.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CommonCount.Infrastructure.Groups;

public class GroupRepository : IGroupRepository
{
    private readonly AppDbContext _db;

    public GroupRepository(AppDbContext db)
    {
        _db = db;
    }
    public async Task<Group?> GetByIdAsync(int groupId)
        => await _db.Groups.FindAsync(groupId);

    public async Task<Group?> GetByInviteCodeAsync(string inviteCode)
        => await _db.Groups.FirstOrDefaultAsync(g => g.InviteCode == inviteCode);

    public async Task<List<Group>> GetGroupsByUserIdAsync(int userId)
        => await _db.Groups
        .Where(g => g.Members.Any(u => u.Id == userId)).ToListAsync();

    public async Task<bool> InviteCodeExistsAsync(string inviteCode)
    => await _db.Groups.AnyAsync(g => g.InviteCode == inviteCode);

    public async Task AddAsync(Group group)
    {
        _db.Groups.Add(group);
        await _db.SaveChangesAsync();
    }

    public async Task SaveChangesAsync() =>
        await _db.SaveChangesAsync();

}