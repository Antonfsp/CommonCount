import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { GroupService, GroupSummary } from '../group.service';
import { CreateGroupDialog } from '../create-group-dialog/create-group-dialog';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-groups-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
  ],
  styleUrl: './groups-overview.css',
  templateUrl: './groups-overview.html',
})
export class GroupsOverview {
  private readonly groupService = inject(GroupService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly groups = signal<GroupSummary[]>([]);
  readonly isLoading = signal(false);

  constructor() {
    this.loadGroups();
  }

  loadGroups(): void {
    this.isLoading.set(true);
    this.groupService.getMyGroups().subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  openCreateGroupDialog(): void {
    const dialogRef = this.dialog.open(CreateGroupDialog, {
    });

    dialogRef.afterClosed().subscribe((groupName : string | null) => this.onDialogClosed(groupName));
  }

  onDialogClosed(groupName: string | null): void {

    if (!groupName) {
      return;
    }

    this.groupService.createGroup(groupName).subscribe({
      next: () => this.loadGroups(),
      error: () => console.error('Failed to create group'),
    });
  }

  openGroup(groupId: number): void {
    this.router.navigate(['/groups', groupId]);
  }
}
