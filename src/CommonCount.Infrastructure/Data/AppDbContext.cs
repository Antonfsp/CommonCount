using Microsoft.EntityFrameworkCore;
using CommonCount.Domain.Entities;

namespace CommonCount.Infrastructure.Data;

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

        modelBuilder.Entity<Group>()
            .HasIndex(g => g.InviteCode)
            .IsUnique();

        // A GroupMember belongs to one Group
        modelBuilder.Entity<GroupMember>()
            .HasOne(gm => gm.Group)
            .WithMany(g => g.Members)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        // A GroupMember may optionally be linked to a User (nullable — "unclaimed" members have no User)
        modelBuilder.Entity<GroupMember>()
            .HasOne(gm => gm.User)
            .WithMany(u => u.GroupMemberships)
            .HasForeignKey(gm => gm.UserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Expense>()
            .Property(e => e.Amount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Expense>()
          .HasOne(e => e.Group)
          .WithMany(g => g.Expenses)
          .HasForeignKey(e => e.GroupId)
          .OnDelete(DeleteBehavior.Cascade);

        // Expense.PaidByMember -> GroupMember (restrict delete: don't cascade-delete expenses if a member is removed)
        modelBuilder.Entity<Expense>()
            .HasOne(e => e.PaidByMember)
            .WithMany()
            .HasForeignKey(e => e.PaidByMemberId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ExpenseParticipant>()
            .Property(ep => ep.ShareAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<ExpenseParticipant>()
            .HasOne(ep => ep.Expense)
            .WithMany(e => e.Participants)
            .HasForeignKey(ep => ep.ExpenseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExpenseParticipant>()
            .HasOne(ep => ep.Member)
            .WithMany()
            .HasForeignKey(ep => ep.MemberId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}