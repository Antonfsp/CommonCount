import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { switchMap } from 'rxjs';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-register-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './register-dialog.html',
  styleUrl: './register-dialog.css',
})
export class RegisterDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<RegisterDialog>);

  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  readonly registerForm = this.formBuilder.nonNullable.group({
    displayName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);
    const { displayName, email, password } = this.registerForm.getRawValue();

    this.auth
      .register({ displayName, email, password })
      .pipe(switchMap(() => this.auth.login({ email, password })))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.dialogRef.close();
          this.router.navigate(['/groups']);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('We could not create your account. Check your details and try again.');
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}