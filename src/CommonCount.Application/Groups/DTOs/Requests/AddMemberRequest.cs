using System.ComponentModel.DataAnnotations;

namespace CommonCount.Application.Groups;

public class AddMemberRequest
{
    [Required]
    [StringLength(80, MinimumLength = 1)]
    public string DisplayName { get; set; } = string.Empty;
}