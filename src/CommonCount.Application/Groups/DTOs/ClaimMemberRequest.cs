namespace CommonCount.Application.Groups;

public class ClaimMemberRequest
{
    public string InviteCode { get; set; } = string.Empty;
    public int? MemberId { get; set; } // null = create a new member instead of claiming one
    public string? NewMemberDisplayName { get; set; }
}