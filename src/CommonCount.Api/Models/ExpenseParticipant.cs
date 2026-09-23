namespace CommonCount.Api.Models;

public class ExpenseParticipant
{
    public int Id { get; set; }

    public int ExpenseId { get; set; }
    public Expense Expense { get; set; } = null!;

    public int MemberId { get; set; }
    public GroupMember Member { get; set; } = null!;

    public decimal ShareAmount { get; set; } //shared amount of the participant
}