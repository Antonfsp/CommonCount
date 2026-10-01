import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Auth } from '../../../core/services/auth';

@Component({
	selector: 'app-login-dialog',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatButtonModule,
		MatDialogModule,
		MatFormFieldModule,
		MatInputModule,
	],
	templateUrl: './login-dialog.html',
	styleUrl: './login-dialog.css',
})
export class LoginDialog {
	private readonly formBuilder = inject(FormBuilder);
	private readonly auth = inject(Auth);
	private readonly router = inject(Router);
	private readonly dialogRef = inject(MatDialogRef<LoginDialog>);

	readonly errorMessage = signal<string | null>(null);
	readonly isLoading = signal(false);

	readonly loginForm = this.formBuilder.nonNullable.group({
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required, Validators.minLength(2)]],
	});

	onSubmit(): void {
		if (this.loginForm.invalid) {
			return;
		}

		this.errorMessage.set(null);
		this.isLoading.set(true);
		const { email, password } = this.loginForm.getRawValue();

		this.auth.login({ email, password }).subscribe({
			next: () => {
				this.isLoading.set(false);
				this.dialogRef.close();
				this.router.navigate(['/groups']);
			},
			error: () => {
				this.isLoading.set(false);
				this.errorMessage.set('Incorrect email or password. Please try again.');
			},
		});
	}

	cancel(): void {
		this.dialogRef.close();
	}
}
