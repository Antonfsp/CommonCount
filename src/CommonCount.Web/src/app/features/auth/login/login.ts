import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { LoginDialog } from './login-dialog/login-dialog';
import { RegisterDialog } from './register-dialog/register-dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly dialog = inject(MatDialog);

  openLoginDialog(): void {
    this.dialog.open(LoginDialog, this.dialogConfig);
  }

  openRegisterDialog(): void {
    this.dialog.open(RegisterDialog, this.dialogConfig);
  }

  private readonly dialogConfig = {
    width: '440px',
    maxWidth: 'calc(100vw - 32px)',
  };
}
