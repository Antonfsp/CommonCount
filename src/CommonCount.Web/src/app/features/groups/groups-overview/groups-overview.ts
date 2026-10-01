import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { GroupService, GroupSummary } from '../group.service';
import { CreateGroupDialog } from '../create-group-dialog/create-group-dialog';
import { LogoutConfirmDialog } from '../logout-confirm-dialog/logout-confirm-dialog';
import { Auth } from '../../../core/services/auth';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-groups-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatToolbarModule,
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
  private readonly auth = inject(Auth);
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

  confirmLogout(): void {
    this.dialog
      .open(LogoutConfirmDialog, {
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.auth.logout();
        this.router.navigate(['/login']);
      });
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
}
