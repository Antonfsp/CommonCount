import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpenseService } from '../../expenses/expense.service';
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
  const dialogOpen = vi.fn(() => ({ afterClosed: () => of(null) }));

  beforeEach(async () => {
    groupService.getGroupMembers.mockReset();
    groupService.getGroupMembers.mockReturnValue(of(initialMembers));
    groupService.addMemberToGroup.mockReset();
    groupService.addMemberToGroup.mockImplementation((_groupId, name) =>
      of({ id: 2, userId: null, name, joinedAt: '2026-10-13T00:00:00Z' }),
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
        { provide: ExpenseService, useValue: {} },
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
