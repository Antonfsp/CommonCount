import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';

import { GroupService, MemberSummary } from '../../groups/group.service';
import { ExpenseService, ExpenseListItem, ExpenseRequest } from '../expense.service';

export type ExpenseDialogData =
  { mode: 'create'; groupId: number } | { mode: 'edit'; groupId: number; expense: ExpenseListItem };

@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
  ],
  selector: 'app-expense-dialog',
  styleUrl: './expense-dialog.css',
  templateUrl: './expense-dialog.html',
})
export class ExpenseDialog {
  private readonly dialogRef = inject(MatDialogRef<ExpenseDialog>);
  private readonly data = inject<ExpenseDialogData>(MAT_DIALOG_DATA);
  private readonly groupService = inject(GroupService);
  private readonly expenseService = inject(ExpenseService);
  private readonly fb = inject(FormBuilder);

  readonly members = signal<MemberSummary[]>([]);
  readonly selectedParticipantIds = signal<number[]>([]);

  readonly isLoadingMembers = signal(false);
  readonly memberLoadError = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly expenseForm = this.fb.group({
    description: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    amount: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0.01),
        Validators.max(99_999_999.99),
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ],
    ],
    paidByMemberId: [null as number | null, Validators.required],
  });

  constructor() {
    if (this.data.mode === 'edit') {
      const expense = this.data.expense;
      this.expenseForm.patchValue({
        description: expense.description,
        amount: expense.amount,
        paidByMemberId: expense.paidByMember.id,
      });
      this.selectedParticipantIds.set([
        ...expense.participants.map((participant) => participant.memberId),
      ]);
    }
    this.loadGroupMembers();
  }

  loadGroupMembers(): void {
    this.isLoadingMembers.set(true);
    this.memberLoadError.set(null);

    this.groupService
      .getGroupMembers(this.data.groupId)
      .pipe(finalize(() => this.isLoadingMembers.set(false)))
      .subscribe({
        next: (members) => this.members.set(members),
        error: (error: unknown) => {
          console.error('Failed to load group members for expense creation.', error);
          this.memberLoadError.set('Could not load the group members. Try again.');
          const groupId = this.data.groupId;
        },
      });
  }

  setParticipantSelected(memberId: number, event: Event): void {
    const selectedIds = this.selectedParticipantIds();
    const selected = (event.currentTarget as HTMLInputElement).checked;
    this.selectedParticipantIds.set(
      selected
        ? selectedIds.includes(memberId)
          ? selectedIds
          : [...selectedIds, memberId]
        : selectedIds.filter((id) => id !== memberId),
    );
  }

  canSubmit(): boolean {
    return (
      !this.isLoadingMembers() &&
      !this.memberLoadError() &&
      this.members().length > 0 &&
      !this.isSaving() &&
      this.expenseForm.valid &&
      this.selectedParticipantIds().length > 0
    );
  }

  saveExpense(): void {
    if (this.isSaving() || this.isLoadingMembers() || this.memberLoadError()) {
      return;
    }

    this.expenseForm.markAllAsTouched();
    if (!this.canSubmit()) {
      return;
    }

    const groupId = this.data.groupId;
    const selectedParticipantIds = this.selectedParticipantIds();
    const { description, amount, paidByMemberId } = this.expenseForm.getRawValue();
    if (
      groupId === null ||
      !description?.trim() ||
      amount === null ||
      paidByMemberId === null ||
      selectedParticipantIds.length === 0
    ) {
      return;
    }

    const request: ExpenseRequest = {
      description: description.trim(),
      amount: amount,
      paidByMemberId: paidByMemberId,
      participantMemberIds: selectedParticipantIds,
    };

    this.isSaving.set(true);
    this.saveError.set(null);

    this.data.mode === 'edit' ? this.editExpense(groupId, this.data.expense.id, request) : this.createExpense(groupId, request);
  }

  createExpense(groupId: number, request: ExpenseRequest): void {
    this.expenseService
      .createExpense(groupId, request)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (error: unknown) => {
          console.error('Failed to create group expense.', error);
          this.saveError.set('Could not save the expense. Try again.');
        },
      });
  }

  editExpense(groupId: number, expenseId: number, request: ExpenseRequest): void {
    this.expenseService
      .editExpense(groupId, expenseId, request)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (error: unknown) => {
          console.error('Failed to edit group expense.', error);
          this.saveError.set('Could not save the expense. Try again.');
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
