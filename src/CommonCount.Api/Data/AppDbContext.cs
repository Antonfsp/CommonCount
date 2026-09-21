using Microsoft.EntityFrameworkCore;
using CommonCount.Api.Models;

namespace CommonCount.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ExpenseParticipant> ExpenseParticipants => Set<ExpenseParticipant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<GroupMember>()
            .HasIndex(gm => new { gm.UserId, gm.GroupId })
            .IsUnique();

        modelBuilder.Entity<Expense>()
            .Property(e => e.Amount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<ExpenseParticipant>()
            .Property(ep => ep.ShareAmount)
            .HasPrecision(10, 2);
    }
}