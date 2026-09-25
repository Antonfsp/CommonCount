import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-group-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-group-dialog.html',
  styleUrl: './create-group-dialog.css',
})
export class CreateGroupDialog {
  private readonly fb = inject(FormBuilder);
  readonly initialName = input('');
  readonly closed = output<string | null>();

  form = this.fb.group({
    name: [this.initialName(), [Validators.required, Validators.minLength(2)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value.name?.trim() ?? null;
    this.closed.emit(value);
  }

  cancel(): void {
    this.closed.emit(null);
  }
}
