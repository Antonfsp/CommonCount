using System.ComponentModel.DataAnnotations;

namespace CommonCount.Application.Groups;

public class AddMemberRequest
{
    [Required]
    [MinLength(1)]
    public string DisplayName { get; set; } = string.Empty;
}