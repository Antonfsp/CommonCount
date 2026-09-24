namespace CommonCount.Application.Groups;

public class JoinGroupPreviewResponse
{
    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public List<UnclaimedMemberResponse> UnclaimedMembers { get; set; } = new();
}

public class UnclaimedMemberResponse
{
    public int MemberId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
}