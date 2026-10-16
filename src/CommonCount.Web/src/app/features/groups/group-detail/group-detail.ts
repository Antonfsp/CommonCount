import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { catchError, forkJoin, map, Observable, of, Subscription } from 'rxjs';

import { CreateExpenseDialog } from '../../expenses/create-expense-dialog/create-expense-dialog';
import { ExpenseListItem, ExpenseService } from '../../expenses/expense.service';
import { GroupService, MemberSummary } from '../group.service';
import {
  GroupSettingsDialog,
  GroupSettingsDialogResult,
} from '../group-settings-dialog/group-settings-dialog';

@Component({
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatTabsModule, MatListModule],
  selector: 'app-group-detail',
  styleUrl: './group-detail.css',
  templateUrl: './group-detail.html',
})
export class GroupDetail {
  private readonly dialog = inject(MatDialog);
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly expenseService = inject(ExpenseService);
  private readonly groupService = inject(GroupService);
  private expenseLoadSubscription: Subscription | null = null;

  readonly expenses = signal<ExpenseListItem[]>([]);
  readonly expenseLoadError = signal<string | null>(null);
  readonly isLoadingExpenses = signal(false);
  readonly hasUnrefreshedSavedExpense = signal(false);
  readonly members = signal<MemberSummary[]>([]);
  readonly groupId = signal<number | null>(null);
  readonly memberLoadError = signal<string | null>(null);

  readonly isLoading = signal(false);



  constructor() {
    this.activatedRoute.paramMap.subscribe((params) => {
      const groupId = Number(params.get('groupId'));

      if (!Number.isSafeInteger(groupId) || groupId <= 0) {
        this.groupId.set(null);
        this.hasUnrefreshedSavedExpense.set(false);
        this.members.set([]);
        this.loadExpenses();
        return;
      }

      if (this.groupId() !== groupId) {
        this.hasUnrefreshedSavedExpense.set(false);
      }
      this.groupId.set(groupId);
      this.loadGroupMembers();
      this.loadExpenses();
    });
  }

  loadExpenses(): void {
    this.expenseLoadSubscription?.unsubscribe();
    this.expenseLoadSubscription = null;

    const groupId = this.groupId();
    if (groupId === null) {
      this.expenses.set([]);
      this.expenseLoadError.set(null);
      this.isLoadingExpenses.set(false);
      return;
    }

    this.isLoadingExpenses.set(true);
    this.expenses.set([]);
    this.expenseLoadError.set(null);
    this.expenseLoadSubscription = this.expenseService.getExpenses(groupId).subscribe({
      next: (expenses) => {
        this.expenses.set(expenses);
        this.isLoadingExpenses.set(false);
        this.hasUnrefreshedSavedExpense.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load group expenses.', error);
        this.expenseLoadError.set(
          this.hasUnrefreshedSavedExpense()
            ? 'Expense saved, but the list could not be refreshed. Retry to update it.'
            : 'Could not load expenses. Try again.',
        );
        this.isLoadingExpenses.set(false);
      },
    });
  }

  loadGroupMembers(retryMemberNames: string[] = []): void {
    const groupId = this.groupId();
    if (groupId === null) {
      return;
    }

    this.isLoading.set(true);
    this.groupService.getGroupMembers(groupId).subscribe({
      next: (members) => {
        this.members.set(members);
        this.memberLoadError.set(null);
        this.isLoading.set(false);

        const existingNames = new Set(members.map((member) => member.displayName.trim().toLowerCase()));
        const namesToRetry = retryMemberNames.filter(
          (name) => !existingNames.has(name.trim().toLowerCase()),
        );

        if (namesToRetry.length > 0) {
          this.openGroupSettingsDialog(
            namesToRetry,
            `Could not add: ${namesToRetry.join(', ')}. You can retry these names.`,
          );
        }
      },
      error: (error: unknown) => {
        console.error('Failed to load group members.', error);
        this.memberLoadError.set('Could not load the group members. Try again.');
        this.isLoading.set(false);

        if (retryMemberNames.length > 0) {
          this.openGroupSettingsDialog(
            retryMemberNames,
            'The roster could not be refreshed. These names may still need to be added; review them and retry if needed.',
          );
        }
      },
    });
  }

  openCreateExpenseDialog(): void {
    const groupId = this.groupId();
    if (groupId === null) {
      return;
    }

    const dialogRef = this.dialog.open(CreateExpenseDialog, { data: { groupId } });

    dialogRef
      .afterClosed()
      .subscribe((created: boolean | null) => this.onCreateExpenseDialogClosed(created));
  }

  onCreateExpenseDialogClosed(created: boolean | null): void {
    if (!created) {
      return;
    }

    this.hasUnrefreshedSavedExpense.set(true);
    this.loadExpenses();
  }

  openGroupSettingsDialog(pendingMembers: string[] = [], message?: string): void {
    const dialogRef = this.dialog.open(GroupSettingsDialog, {
      data: {
        members: this.members(),
        pendingMembers,
        message: message ?? this.memberLoadError() ?? undefined,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: GroupSettingsDialogResult | null) =>
        this.onGroupSettingsDialogClosed(result),
      );
  }

  onGroupSettingsDialogClosed(result: GroupSettingsDialogResult | null): void {
    if (result === null) {
      return; // Cancelled; don't send anything to the backend.
    }

    const groupId = this.groupId();
    if (groupId === null) {
      return;
    }

    const originalMembersById = new Map(this.members().map((member) => [member.id, member]));

    const changedMembers = result.existingMembers.filter((member) => {
      const original = originalMembersById.get(member.id);
      return original !== undefined && original.displayName !== member.displayName;
    });

    const requests: Observable<SaveResult>[] = [
      ...result.pendingMembers.map((name) =>
        this.groupService.addMemberToGroup(groupId, name).pipe(
          map((): SaveResult => ({ success: true })),
          catchError((error: unknown): Observable<SaveResult> => {
            console.error(`Failed to add group member "${name}".`, error);
            return of({ success: false, operation: 'add', name });
          }),
        ),
      ),
      ...changedMembers.map((member) =>
        this.groupService.updateGroupMember(groupId, member.id, member.displayName).pipe(
          map((): SaveResult => ({ success: true })),
          catchError((error: unknown): Observable<SaveResult> => {
            console.error(`Failed to update group member ${member.id} to "${member.displayName}".`, error);
            return of({
              success: false,
              operation: 'update',
              name: member.displayName,
              memberId: member.id,
            });
          }),
        ),
      ),
    ];

    if (requests.length === 0) {
      return;
    }

    forkJoin(requests).subscribe(() => {
      this.loadGroupMembers();
    });
  }
}

type SaveResult =
  | { success: true }
  | { success: false; operation: 'add' | 'update'; name: string; memberId?: number };
