import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { GroupService, GroupSummary } from '../group.service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NewGroupDialog } from '../new-group-dialog/new-group-dialog';

@Component({
  selector: 'app-groups-overview',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatDialogModule],
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

  openNewGroupDialog(): void {
    this.dialog.open(NewGroupDialog, { autoFocus: 'dialog'})
    .afterClosed().subscribe((created) => {
      if (created) this.loadGroups()
    })
  }

  openGroup(groupId: number): void {
    this.router.navigate(['/groups', groupId]);
  }
}
