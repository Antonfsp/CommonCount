import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, vi } from 'vitest';

import { GroupService } from '../../groups/group.service';
import { ExpenseService } from '../expense.service';
import { CreateExpenseDialog } from './expense-dialog';

describe('CreateExpenseDialog', () => {
  let component: CreateExpenseDialog;
  let fixture: ComponentFixture<CreateExpenseDialog>;
  const members = [
    { id: 1, userId: 1, name: 'Owner', joinedAt: '2026-10-13T00:00:00Z' },
    { id: 2, userId: null, name: 'Alex', joinedAt: '2026-10-13T00:00:00Z' },
  ];
  const groupService = { getGroupMembers: vi.fn(() => of(members)) };
  const expenseService = {
    createExpense: vi.fn(() => of({ id: 9, description: 'Dinner', amount: 10, date: '' })),
  };
  const dialogRef = { close: vi.fn() };

  afterEach(() => vi.restoreAllMocks());

  beforeEach(async () => {
    groupService.getGroupMembers.mockReset();
    groupService.getGroupMembers.mockReturnValue(of(members));
    expenseService.createExpense.mockReset();
    expenseService.createExpense.mockReturnValue(
      of({ id: 9, description: 'Dinner', amount: 10, date: '' }),
    );
    dialogRef.close.mockReset();

    await TestBed.configureTestingModule({
      imports: [CreateExpenseDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { groupId: 42 } },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: GroupService, useValue: groupService },
        { provide: ExpenseService, useValue: expenseService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateExpenseDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('loads the current group roster for payer and participant choices', () => {
    fixture.detectChanges();

    expect(groupService.getGroupMembers).toHaveBeenCalledWith(42);
    expect(fixture.nativeElement.textContent).toContain('Owner');
    expect(fixture.nativeElement.textContent).toContain('Alex');
    expect(fixture.nativeElement.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
  });

  it('sends a group expense with the selected payer and participants and closes after success', async () => {
    await fillValidExpenseForm();

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();

    expect(expenseService.createExpense).toHaveBeenCalledWith(42, {
      description: 'Dinner',
      amount: 10.01,
      paidByMemberId: 1,
      participantMemberIds: [2],
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('keeps entered values and allows retry after a save failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const pendingSave = new Subject<{
      id: number;
      description: string;
      amount: number;
      date: string;
    }>();
    expenseService.createExpense.mockReturnValue(pendingSave);
    await fillValidExpenseForm();

    const submitButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    submitButton.click();
    fixture.detectChanges();

    expect(submitButton.disabled).toBe(true);
    expect(submitButton.textContent).toContain('Saving');

    pendingSave.error(new Error('Request failed'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not save the expense.');
    expect(
      (
        fixture.nativeElement.querySelector(
          'input[formControlName="description"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('Dinner');
    expect(submitButton.disabled).toBe(false);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('does not allow an amount with more than two decimal places', async () => {
    await fillValidExpenseForm('10.001');

    const submitButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);
    expect(expenseService.createExpense).not.toHaveBeenCalled();
  });

  it('does not allow a whitespace-only description', async () => {
    await fillValidExpenseForm();
    const description = fixture.nativeElement.querySelector(
      'input[formControlName="description"]',
    ) as HTMLInputElement;
    description.value = '   ';
    description.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(expenseService.createExpense).not.toHaveBeenCalled();
  });

  it('allows retrying after the group roster fails to load', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    groupService.getGroupMembers.mockReturnValueOnce(throwError(() => new Error('Request failed')));

    component.loadGroupMembers();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not load the group members.');
    expect(
      (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).disabled,
    ).toBe(true);

    groupService.getGroupMembers.mockReturnValueOnce(of(members));
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Alex');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  async function fillValidExpenseForm(amountValue = '10.01'): Promise<void> {
    const description = fixture.nativeElement.querySelector(
      'input[formControlName="description"]',
    ) as HTMLInputElement;
    description.value = 'Dinner';
    description.dispatchEvent(new Event('input'));

    const amount = fixture.nativeElement.querySelector(
      'input[formControlName="amount"]',
    ) as HTMLInputElement;
    amount.value = amountValue;
    amount.dispatchEvent(new Event('input'));

    const payerSelect = fixture.nativeElement.querySelector('mat-select') as HTMLElement;
    payerSelect.click();
    fixture.detectChanges();
    const ownerOption = Array.from(document.querySelectorAll('mat-option')).find((option) =>
      option.textContent?.includes('Owner'),
    ) as HTMLElement | undefined;
    ownerOption?.click();
    fixture.detectChanges();

    const participant = fixture.nativeElement.querySelectorAll(
      '.participants-selection-list input[type="checkbox"]',
    )[1] as HTMLInputElement;
    participant.click();
    fixture.detectChanges();
  }
});
