using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CommonCount.Api.Migrations
{
    /// <inheritdoc />
    public partial class RefactorGroupMemberToDecoupleFromUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExpenseParticipants_Users_UserId",
                table: "ExpenseParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_Users_PaidByUserId",
                table: "Expenses");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMembers_Users_UserId",
                table: "GroupMembers");

            migrationBuilder.DropIndex(
                name: "IX_GroupMembers_UserId_GroupId",
                table: "GroupMembers");

            migrationBuilder.RenameColumn(
                name: "PaidByUserId",
                table: "Expenses",
                newName: "PaidByMemberId");

            migrationBuilder.RenameIndex(
                name: "IX_Expenses_PaidByUserId",
                table: "Expenses",
                newName: "IX_Expenses_PaidByMemberId");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "ExpenseParticipants",
                newName: "MemberId");

            migrationBuilder.RenameIndex(
                name: "IX_ExpenseParticipants_UserId",
                table: "ExpenseParticipants",
                newName: "IX_ExpenseParticipants_MemberId");

            migrationBuilder.AddColumn<string>(
                name: "InviteCode",
                table: "Groups",
                type: "NVARCHAR2(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "GroupMembers",
                type: "NUMBER(10)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "NUMBER(10)");

            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "GroupMembers",
                type: "NVARCHAR2(2000)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_InviteCode",
                table: "Groups",
                column: "InviteCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_UserId",
                table: "GroupMembers",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ExpenseParticipants_GroupMembers_MemberId",
                table: "ExpenseParticipants",
                column: "MemberId",
                principalTable: "GroupMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_GroupMembers_PaidByMemberId",
                table: "Expenses",
                column: "PaidByMemberId",
                principalTable: "GroupMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMembers_Users_UserId",
                table: "GroupMembers",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExpenseParticipants_GroupMembers_MemberId",
                table: "ExpenseParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_GroupMembers_PaidByMemberId",
                table: "Expenses");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMembers_Users_UserId",
                table: "GroupMembers");

            migrationBuilder.DropIndex(
                name: "IX_Groups_InviteCode",
                table: "Groups");

            migrationBuilder.DropIndex(
                name: "IX_GroupMembers_UserId",
                table: "GroupMembers");

            migrationBuilder.DropColumn(
                name: "InviteCode",
                table: "Groups");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "GroupMembers");

            migrationBuilder.RenameColumn(
                name: "PaidByMemberId",
                table: "Expenses",
                newName: "PaidByUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Expenses_PaidByMemberId",
                table: "Expenses",
                newName: "IX_Expenses_PaidByUserId");

            migrationBuilder.RenameColumn(
                name: "MemberId",
                table: "ExpenseParticipants",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_ExpenseParticipants_MemberId",
                table: "ExpenseParticipants",
                newName: "IX_ExpenseParticipants_UserId");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "GroupMembers",
                type: "NUMBER(10)",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "NUMBER(10)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_UserId_GroupId",
                table: "GroupMembers",
                columns: new[] { "UserId", "GroupId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ExpenseParticipants_Users_UserId",
                table: "ExpenseParticipants",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_Users_PaidByUserId",
                table: "Expenses",
                column: "PaidByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMembers_Users_UserId",
                table: "GroupMembers",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
