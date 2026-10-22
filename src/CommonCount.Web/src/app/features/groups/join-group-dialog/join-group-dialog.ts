import { Component, signal, inject } from '@angular/core';
import { FormField, form, required, minLength, maxLength } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';

import { JoinGroupRequest, GroupService, JoinGroupPreviewReponse } from '../group.service';

@Component({
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinner,
    MatRadioModule,
  ],
  selector: 'app-join-group-dialog',
  styleUrl: './join-group-dialog.css',
  templateUrl: './join-group-dialog.html',
})
export class JoinGroupDialog {
  readonly dialogRef = inject(MatDialogRef<JoinGroupDialog>);
  readonly groupService = inject(GroupService);
  readonly model = signal({ inviteCode: '', memberChoice: '', selectedMemberName: '' });
  readonly groupPreview = signal<JoinGroupPreviewReponse | null>(null);

  protected readonly isSearching = signal(false);
  readonly searchError = signal<string | null>(null);

  readonly joinForm = form(this.model, (schema) => {
    required(schema.inviteCode, { message: 'Enter an invite code' });
    minLength(schema.inviteCode, 6, { message: 'The invite code must be 6 characters' });
    maxLength(schema.inviteCode, 6, { message: 'The invite code must be 6 characters' });
    required(schema.memberChoice, { message: 'Select a member' });
  });

  findGroup(): void {
    const field = this.joinForm.inviteCode();
    if (field.invalid()) {
      field.markAsTouched();
      return;
    }

    this.groupPreview.set(null);
    this.searchError.set(null);
    this.isSearching.set(true);

    const inviteCode = this.model().inviteCode.trim().toUpperCase();

    this.groupService.getGroupByInviteCode(inviteCode).subscribe({
      next: (preview) => this.groupPreview.set(preview),
      error: (error) => {
        console.error('Faile to find group', error);
        this.searchError.set('Could not find a group with that invite code');
        this.isSearching.set(false);
      },
      complete: () => this.isSearching.set(false),
    });
  }

  joinGroup(): void {
    const preview = this.groupPreview();
    const memberChoice = this.model().memberChoice;
    const selectedMemberName = this.model().selectedMemberName;

    if (!preview || !memberChoice) {
      this.joinForm.memberChoice().markAsTouched();
      return;
    }

    const isCreatingMember = memberChoice === 'new';
    const memberName = selectedMemberName.trim();

    if (isCreatingMember && !memberName) {
      this.joinForm.selectedMemberName().markAsTouched();
      return;
    }

    const request: JoinGroupRequest = {
      inviteCode: preview.inviteCode,
      memberId: isCreatingMember ? null : Number(memberChoice),
      newMemberDisplayName: isCreatingMember ? memberName : null
    };


    this.groupService.joinGroup(request).subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        console.error('Failed to join group', error);
        this.searchError.set('Could not join the group. Please try again.')
      }
    });

  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
