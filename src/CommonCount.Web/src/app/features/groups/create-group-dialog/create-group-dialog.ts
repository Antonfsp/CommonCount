import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-group-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './create-group-dialog.html',
  styleUrl: './create-group-dialog.css',
})
export class CreateGroupDialog {
  readonly dialogRef = inject(MatDialogRef<CreateGroupDialog>);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close(this.form.value.name);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
