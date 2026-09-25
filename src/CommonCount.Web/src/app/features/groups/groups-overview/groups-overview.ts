import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { GroupService, GroupSummary } from '../group.service';
import { CreateGroupDialog } from '../create-group-dialog/create-group-dialog';

@Component({
  selector: 'app-groups-overview',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CreateGroupDialog],
  styleUrl: './groups-overview.css',
  templateUrl: './groups-overview.html',
})
export class GroupsOverview {
  private readonly groupService = inject(GroupService);
  private readonly fb = inject(FormBuilder);

  readonly groups = signal<GroupSummary[]>([]);
  readonly isLoading = signal(false);
  readonly showCreateDialog = signal(false);
  readonly emptyMessage = computed(() =>
    this.groups().length === 0 ? 'You are not part of any group yet.' : ''
  );

  readonly groupForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

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
    this.showCreateDialog.set(true);
    this.groupForm.reset();
  }

  closeCreateGroupDialog(): void {
    this.showCreateDialog.set(false);
    this.groupForm.reset();
  }

  onDialogClosed(value: string | null): void {
    this.closeCreateGroupDialog();

    if (!value || !value.trim()) {
      return;
    }

    this.groupService.createGroup(value.trim()).subscribe({
      next: () => this.loadGroups(),
      error: () => console.error('Failed to create group'),
    });
  }
}
