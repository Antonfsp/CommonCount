import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { form, required, FormField } from '@angular/forms/signals';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectionList, MatListOption } from '@angular/material/list';

import { ExpenseSummary } from '../expense.service';

@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatSelectionList,
    MatListOption,
    FormField
  ],
  selector: 'app-create-expense-dialog',
  styleUrl: './create-expense-dialog.css',
  templateUrl: './create-expense-dialog.html',
})
export class CreateExpenseDialog {
  readonly dialogRef = inject(MatDialogRef<CreateExpenseDialog>);
  private readonly fb = inject(FormBuilder);

  private readonly expenseModel = signal<ExpenseSummary>({
    id: 0,
    name: '',
    amount: 0,
    payedById: 0,
  });

  private readonly expenseForm = form(this.expenseModel, (path) => {
    required(path.name, { message: "Expense's name is required" });
    required(path.amount, { message: "Expense's amount is required" });
    required(path.payedById, { message: 'Select who payed the expense' });
  });

  createExpense(): void {
    if (this.expenseForm().invalid()) {
      return;
    }

    this.dialogRef.close(this.expenseModel().name);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
