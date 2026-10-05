import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { Auth } from '../../../core/services/auth';
import { LogoutConfirmDialog } from '../logout-confirm-dialog/logout-confirm-dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-groups-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatToolbarModule,
  ],
  styleUrl: './groups-layout.css',
  templateUrl: './groups-layout.html',
})
export class GroupsLayout {
  private readonly auth = inject(Auth);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly isGroupDetail = signal(this.router.url.startsWith('/groups/'));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.isGroupDetail.set(event.urlAfterRedirects.startsWith('/groups/')));
  }

  confirmLogout(): void {
    this.dialog
      .open(LogoutConfirmDialog, {
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.auth.logout();
        this.router.navigate(['/main']);
      });
  }
}
