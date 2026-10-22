import { Component, inject } from '@angular/core';

import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { GroupService } from '../group.service';
import { CreateGroupDialog } from '../create-group-dialog/create-group-dialog';
import { JoinGroupDialog } from '../join-group-dialog/join-group-dialog';

@Component({
  imports: [MatDialogModule, MatIcon, MatButtonModule],
  selector: 'app-new-group-dialog',
  styleUrl: './new-group-dialog.css',
  templateUrl: './new-group-dialog.html',
})
export class NewGroupDialog {
  private readonly dialog = inject(MatDialog);
  private readonly groupService = inject(GroupService);
  private readonly dialogRef = inject(MatDialogRef<NewGroupDialog>);

  openCreateGroupDialog(): void {
    const dialogRef = this.dialog.open(CreateGroupDialog, {});
    dialogRef
      .afterClosed()
      .subscribe((groupDetails: { name: string; memberName: string } | null) =>
        this.onCreateGroupDialogClosed(groupDetails),
      );
  }

  onCreateGroupDialogClosed(groupDetails: { name: string; memberName: string } | null): void {
    if (!groupDetails?.name) {
      return;
    }

    this.groupService.createGroup(groupDetails.name, groupDetails.memberName).subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => console.error('Failed to create group', error),
    });
  }

  openJoinGroupDialog(): void {
    const dialogRef = this.dialog
      .open(JoinGroupDialog, {})
      .afterClosed()
      .subscribe((joined) => {
        if (joined) {
          this.dialogRef.close(true);
        }
      });
  }
}
