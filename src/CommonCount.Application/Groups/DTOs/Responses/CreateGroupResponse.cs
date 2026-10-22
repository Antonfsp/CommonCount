namespace CommonCount.Application.Groups;

public class CreateGroupResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = String.Empty;
    public string InviteCode { get; set; } = String.Empty;
}