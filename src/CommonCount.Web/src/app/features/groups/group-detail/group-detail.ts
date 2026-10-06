import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';

import { CreateExpenseDialog } from '../../expenses/create-expense-dialog/create-expense-dialog';
import { ExpenseService, ExpenseSummary } from '../../expenses/expense.service';
@Component({
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatListModule],
  selector: 'app-group-detail',
  styleUrl: './group-detail.css',
  templateUrl: './group-detail.html',
})
export class GroupDetail {
  private readonly dialog = inject(MatDialog);
  private readonly expenseService = inject(ExpenseService);

  readonly expenses = signal<ExpenseSummary[]>([]);
  readonly isLoading = signal(false);

  loadExpenses(): void {
    this.isLoading.set(true);
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        this.expenses.set(expenses);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  openCreateExpenseDialog(): void {
    const dialogRef = this.dialog.open(CreateExpenseDialog, {});

    dialogRef
      .afterClosed()
      .subscribe((expenseName: string | null) => this.onDialogClosed(expenseName));
  }

  onDialogClosed(expenseName: string | null): void {
    if (!expenseName) {
      return;
    }

    this.expenseService.createExpense(expenseName).subscribe({
      next: () => this.loadExpenses(),
      error: () => console.error('Failed to create expense'),
    });
  }
}
