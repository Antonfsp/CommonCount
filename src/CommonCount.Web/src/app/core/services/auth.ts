import { Service, inject, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { RegisterRequest } from '../models/register-request';
import { LoginRequest } from '../models/login-request';
import { AuthResponse, RegisterResponse } from '../models/auth-response.model';
import { TokenStorage } from './token-storage';
import { environment } from '../../../environments/environment';

@Service()
export class Auth {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorage);

  private readonly token = signal(this.tokenStorage.getToken());
  readonly isAuthenticated = computed(() => !!this.token());
  readonly displayName = signal(this.tokenStorage.getDisplayName());
  readonly userId = signal(this.tokenStorage.getUserId());

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.token);
        this.tokenStorage.setDisplayName(response.displayName);
        this.tokenStorage.setUserId(response.userId.toString());
        this.token.set(response.token);
        this.userId.set(response.userId.toString());
        this.displayName.set(response.displayName);
      })
    );
  }

  logout() {
    this.tokenStorage.clear();
    this.token.set(null);
    this.displayName.set(null);
    this.userId.set(null);
  }
}
