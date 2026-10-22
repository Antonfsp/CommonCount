namespace CommonCount.Application.Groups;

public class JoinGroupPreviewResponse
{
    public string InviteCode { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public List<GroupMemberResponse> Members { get; set; } = new();
}

public class GroupMemberResponse
{
    public int MemberId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public bool IsClaimed { get; set; }
}