namespace CommonCount.Application.Groups;

public class UpdateGroupMemberResponse
{
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string DisplayName { get; set; } = "";
        public DateTime JoinedAt { get; set; }
}