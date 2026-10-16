import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { beforeEach, describe, expect, it } from 'vitest';
import { GroupSettingsDialog } from './group-settings-dialog';

describe('GroupSettingsDialog', () => {
  let component: GroupSettingsDialog;
  let fixture: ComponentFixture<GroupSettingsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupSettingsDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { members: [] } },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupSettingsDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stages each member and clears the input without closing', () => {
    component.form.controls.name.setValue('  Alex  ');

    component.addMember();

    expect(component.pendingMembers()).toEqual(['Alex']);
    expect(component.form.controls.name.value).toBe('');
  });

  it('rejects a name that duplicates an existing or pending member regardless of case', () => {
    component.data.members.push({
      id: 1,
      userId: 1,
      displayName: 'Alex',
      joinedAt: '',
    });
    component.editedExistingMembers.set(component.data.members.map((member) => ({ ...member })));

    component.form.controls.name.setValue(' alex ');
    component.addMember();
    expect(component.pendingMembers()).toEqual([]);
    expect(component.form.controls.name.hasError('duplicate')).toBe(true);

    component.form.controls.name.setValue('Sam');
    component.addMember();
    component.form.controls.name.setValue(' sam ');
    component.addMember();

    expect(component.pendingMembers()).toEqual(['Sam']);
    expect(component.form.controls.name.hasError('duplicate')).toBe(true);
  });

  it('rejects adding a pending member with an edited existing member name', () => {
    const existingMember = {
      id: 1,
      userId: null,
      displayName: 'Alex',
      joinedAt: '',
    };
    component.data.members.push(existingMember);
    component.editedExistingMembers.set([{ ...existingMember }]);

    component.startExistingMemberEdit(0);
    component.editingMemberName.set('Alex Smith');
    component.saveExistingMemberEdit();

    component.form.controls.name.setValue('Alex Smith');
    component.addMember();

    expect(component.pendingMembers()).toEqual([]);
    expect(component.form.controls.name.hasError('duplicate')).toBe(true);
  });

  it('disables the add button without a valid input and enables it for a member name', () => {
    fixture.detectChanges();

    const addButton = fixture.nativeElement.querySelector(
      '[aria-label="Add member to pending list"]',
    ) as HTMLButtonElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(addButton.disabled).toBe(true);

    input.value = 'Alex';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(addButton.disabled).toBe(false);
    addButton.click();
    fixture.detectChanges();

    expect(component.pendingMembers()).toEqual(['Alex']);
  });

  it('keeps the add button disabled for whitespace-only input', () => {
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const addButton = fixture.nativeElement.querySelector(
      '[aria-label="Add member to pending list"]',
    ) as HTMLButtonElement;

    expect(addButton.disabled).toBe(true);
  });
});
