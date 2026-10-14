import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { catchError, forkJoin, map, of, Subscription } from 'rxjs';

import { CreateExpenseDialog } from '../../expenses/create-expense-dialog/create-expense-dialog';
import { ExpenseListItem, ExpenseService } from '../../expenses/expense.service';
import { GroupService, MemberSummary } from '../group.service';
import { GroupSettingsDialog } from '../group-settings-dialog/group-settings-dialog';

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
  readonly members = signal<MemberSummary[]>([]);
  readonly groupId = signal<number | null>(null);
  readonly memberLoadError = signal<string | null>(null);

  readonly isLoading = signal(false);

  constructor() {
    this.activatedRoute.paramMap.subscribe((params) => {
      const groupId = Number(params.get('groupId'));

      if (!Number.isSafeInteger(groupId) || groupId <= 0) {
        this.groupId.set(null);
        this.members.set([]);
        this.loadExpenses();
        return;
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
      },
      error: (error: unknown) => {
        console.error('Failed to load group expenses.', error);
        this.expenseLoadError.set('Could not load expenses. Try again.');
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

        const existingNames = new Set(
          members.map((member) => member.name.trim().toLowerCase()),
        );
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
    const dialogRef = this.dialog.open(CreateExpenseDialog, {});

    dialogRef
      .afterClosed()
      .subscribe((expenseName: string | null) => this.onCreateExpenseDialogClosed(expenseName));
  }

  onCreateExpenseDialogClosed(expenseName: string | null): void {
    if (!expenseName) {
      return;
    }

    this.expenseService.createExpense(expenseName).subscribe({
      next: () => this.loadExpenses(),
      error: () => console.error('Failed to create expense'),
    });
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
      .subscribe((memberNames: string[] | null) => this.onGroupSettingsDialogClosed(memberNames));
  }

  onGroupSettingsDialogClosed(memberNames: string[] | null): void {
    if (!memberNames?.length) {
      return;
    }

    const groupId = this.groupId();
    if (groupId === null) {
      return;
    }

    const additions = memberNames.map((name) =>
      this.groupService.addMemberToGroup(groupId, name).pipe(
        map(() => ({ name, success: true as const })),
        catchError((error: unknown) => {
          console.error(`Failed to add group member "${name}".`, error);
          return of({ name, success: false as const });
        }),
      ),
    );

    forkJoin(additions).subscribe((results) => {
      const failedNames = results
        .filter((result) => !result.success)
        .map((result) => result.name);
      this.loadGroupMembers(failedNames);
    });
  }
}
