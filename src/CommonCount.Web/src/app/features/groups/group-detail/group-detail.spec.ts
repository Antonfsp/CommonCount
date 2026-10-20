import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpenseListItem, ExpenseService } from '../../expenses/expense.service';
import { CreateExpenseDialog } from '../../expenses/expense-dialog/expense-dialog';
import { GroupService, MemberSummary } from '../group.service';
import { GroupSettingsDialog } from '../group-settings-dialog/group-settings-dialog';
import { GroupDetail } from './group-detail';

describe('GroupDetail', () => {
  let component: GroupDetail;
  let fixture: ComponentFixture<GroupDetail>;
  const initialMembers: MemberSummary[] = [
    { id: 1, userId: 1, name: 'Owner', joinedAt: '2026-10-13T00:00:00Z' },
  ];
  const groupService = {
    getGroupMembers: vi.fn(() => of(initialMembers)),
    addMemberToGroup: vi.fn((_groupId: number | null, name: string) =>
      of({ id: 2, userId: null, name, joinedAt: '2026-10-13T00:00:00Z' }),
    ),
  };
  const expenses = {
    getExpenses: vi.fn(() =>
      of([
        {
          id: 7,
          description: 'Dinner',
          amount: 24.5,
          date: '2026-10-14T08:30:00Z',
          paidByMember: { id: 1, name: 'Owner' },
        },
      ]),
    ),
    createExpense: vi.fn(),
  };
  const dialogOpen = vi.fn(() => ({ afterClosed: (): Observable<unknown> => of(null) }));

  beforeEach(async () => {
    groupService.getGroupMembers.mockReset();
    groupService.getGroupMembers.mockReturnValue(of(initialMembers));
    groupService.addMemberToGroup.mockReset();
    groupService.addMemberToGroup.mockImplementation((_groupId, name) =>
      of({ id: 2, userId: null, name, joinedAt: '2026-10-13T00:00:00Z' }),
    );
    expenses.getExpenses.mockReset();
    expenses.getExpenses.mockReturnValue(
      of([
        {
          id: 7,
          description: 'Dinner',
          amount: 24.5,
          date: '2026-10-14T08:30:00Z',
          paidByMember: { id: 1, name: 'Owner' },
        },
      ]),
    );
    dialogOpen.mockReset();
    dialogOpen.mockReturnValue({ afterClosed: () => of(null) });

    await TestBed.configureTestingModule({
      imports: [GroupDetail],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ groupId: '1' })) },
        },
        { provide: GroupService, useValue: groupService },
        { provide: ExpenseService, useValue: expenses },
        { provide: MatDialog, useValue: { open: dialogOpen } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(groupService.getGroupMembers).toHaveBeenCalledWith(1);
    expect(expenses.getExpenses).toHaveBeenCalledWith(1);
  });

  it('shows the group expenses returned by the backend', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Dinner');
    expect(fixture.nativeElement.textContent).toContain('24.50');
    expect(fixture.nativeElement.textContent).toContain('Owner');
    expect(fixture.nativeElement.textContent).not.toContain('exemple');
  });

  it('shows loading feedback on entry until the backend returns group expenses', async () => {
    fixture.destroy();
    const pendingExpenses = new Subject<ExpenseListItem[]>();
    expenses.getExpenses.mockReset();
    expenses.getExpenses.mockReturnValue(pendingExpenses);
    fixture = TestBed.createComponent(GroupDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading expenses',
    );

    pendingExpenses.next([
      {
        id: 8,
        description: 'Groceries',
        amount: 8,
        date: '2026-10-14T08:00:00Z',
        paidByMember: { id: 1, name: 'Owner' },
      },
    ]);
    pendingExpenses.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Groceries');
  });

  it('does not show results from an earlier group request', () => {
    const earlierRequest = new Subject<ExpenseListItem[]>();
    expenses.getExpenses.mockReturnValueOnce(earlierRequest).mockReturnValueOnce(
      of([
        {
          id: 9,
          description: 'Taxi',
          amount: 15,
          date: '2026-10-14T08:00:00Z',
          paidByMember: { id: 1, name: 'Owner' },
        },
      ]),
    );

    component.loadExpenses();
    component.groupId.set(2);
    component.loadExpenses();
    earlierRequest.next([
      {
        id: 8,
        description: 'Old group expense',
        amount: 8,
        date: '2026-10-14T08:00:00Z',
        paidByMember: { id: 1, name: 'Owner' },
      },
    ]);
    earlierRequest.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Taxi');
    expect(fixture.nativeElement.textContent).not.toContain('Old group expense');
    expect(expenses.getExpenses).toHaveBeenLastCalledWith(2);
  });

  it('distinguishes a group with no expenses from a loading failure', () => {
    expenses.getExpenses.mockReturnValueOnce(of([]));

    component.loadExpenses();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No expenses yet.');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('allows retrying after group expenses fail to load', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expenses.getExpenses.mockReturnValueOnce(throwError(() => new Error('Request failed')));

    component.loadExpenses();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not load expenses.');

    expenses.getExpenses.mockReturnValueOnce(
      of([
        {
          id: 8,
          description: 'Groceries',
          amount: 8,
          date: '2026-10-14T08:00:00Z',
          paidByMember: { id: 1, name: 'Owner' },
        },
      ]),
    );
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Groceries');
    expect(expenses.getExpenses).toHaveBeenLastCalledWith(1);
  });

  it('reports a confirmed save separately when refreshing the group list fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    dialogOpen.mockReturnValue({ afterClosed: () => of(true) });
    expenses.getExpenses.mockReturnValueOnce(throwError(() => new Error('Request failed')));

    component.openCreateExpenseDialog();
    fixture.detectChanges();

    expect(dialogOpen).toHaveBeenCalledWith(CreateExpenseDialog, { data: { groupId: 1 } });
    expect(fixture.nativeElement.textContent).toContain(
      'Expense saved, but the list could not be refreshed.',
    );
    expect(expenses.createExpense).not.toHaveBeenCalled();

    expenses.getExpenses.mockReturnValueOnce(
      of([
        {
          id: 8,
          description: 'Dinner',
          amount: 10,
          date: '2026-10-14T08:30:00Z',
          paidByMember: { id: 1, name: 'Owner' },
        },
      ]),
    );
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Dinner');
  });

  it('refreshes the group expense list after the dialog confirms creation', () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(true) });
    expenses.getExpenses.mockReturnValueOnce(
      of([
        {
          id: 8,
          description: 'Dinner',
          amount: 10,
          date: '2026-10-14T08:30:00Z',
          paidByMember: { id: 1, name: 'Owner' },
        },
      ]),
    );

    component.openCreateExpenseDialog();
    fixture.detectChanges();

    expect(expenses.getExpenses).toHaveBeenLastCalledWith(1);
    expect(fixture.nativeElement.textContent).toContain('Dinner');
  });

  it('keeps successful additions and reopens settings with only failed names', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    groupService.addMemberToGroup.mockImplementation((_groupId, name) =>
      name === 'Sam'
        ? throwError(() => new Error('Request failed'))
        : of({ id: 2, userId: null, name, joinedAt: '2026-10-13T00:00:00Z' }),
    );
    groupService.getGroupMembers.mockReturnValue(
      of([
        ...initialMembers,
        { id: 2, userId: null, name: 'Alex', joinedAt: '2026-10-13T00:00:00Z' },
      ]),
    );

    component.onGroupSettingsDialogClosed(['Alex', 'Sam']);

    expect(groupService.addMemberToGroup).toHaveBeenCalledTimes(2);
    expect(dialogOpen).toHaveBeenCalledWith(
      GroupSettingsDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          members: expect.arrayContaining([expect.objectContaining({ name: 'Alex' })]),
          pendingMembers: ['Sam'],
          message: 'Could not add: Sam. You can retry these names.',
        }),
      }),
    );
  });
});
