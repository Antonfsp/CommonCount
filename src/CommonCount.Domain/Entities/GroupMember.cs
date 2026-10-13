namespace CommonCount.Domain.Entities;

public class GroupMember
{
    public int Id { get; set; }

    public string DisplayName { get; set; } = string.Empty; // Name shown in the group's roster
    public int? UserId { get; set; }
    public User? User { get; set; } = null!;

    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}