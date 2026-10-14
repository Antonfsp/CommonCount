namespace CommonCount.Application.Groups;

public class CreateExpenseRequest
{
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int PaidByMemberId { get; set; }
    public List<int>? ParticipantMemberIds { get; set; } = [];
}
