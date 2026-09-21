namespace CommonCount.Api.Models;

public class Expense
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;

    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public int PaidByUserId { get; set; }
    public User PaidByUser { get; set; } = null!;

    public ICollection<ExpenseParticipant> Participants { get; set; } = new List<ExpenseParticipant>();
}