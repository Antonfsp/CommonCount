using System.ComponentModel.DataAnnotations;

namespace CommonCount.Application.Groups;

public class CreateGroupRequest
{
    [Required]
    [MinLength(2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MinLength(2)]
    [MaxLength(80)]
    public string MemberName { get; set; } = string.Empty;
}