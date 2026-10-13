import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';

import { MemberSummary } from '../group.service';

interface GroupSettingsDialogData {
  members: MemberSummary[];
  pendingMembers?: string[];
  message?: string;
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
  ],
  selector: 'app-group-settings-dialog',
  styleUrl: './group-settings-dialog.css',
  templateUrl: './group-settings-dialog.html',
})
export class GroupSettingsDialog {
  readonly dialogRef = inject(MatDialogRef<GroupSettingsDialog>);
  readonly data = inject<GroupSettingsDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);

  readonly pendingMembers = signal<string[]>(this.data.pendingMembers ?? []);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  addMember(): void {
    if (this.form.invalid) {
      this.form.controls.name.markAsTouched();
      return;
    }

    const name = this.form.controls.name.value.trim();
    const isDuplicate = [...this.data.members.map((member) => member.name), ...this.pendingMembers()]
      .some((memberName) => memberName.trim().toLowerCase() === name.toLowerCase());

    if (isDuplicate) {
      this.form.controls.name.setErrors({ duplicate: true });
      this.form.controls.name.markAsTouched();
      return;
    }

    this.pendingMembers.update((members) => [...members, name]);
    this.form.controls.name.reset();
  }

  finish(): void {
    this.dialogRef.close(this.pendingMembers());
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
