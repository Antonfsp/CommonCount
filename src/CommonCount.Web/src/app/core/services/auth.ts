import { Service, inject, computed } from '@angular/core';
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

  readonly isAuthenticated = computed(() => this.tokenStorage.isLoggedIn());

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.token);
      })
    );
  }

  logout() {
    this.tokenStorage.removeToken();
  }
}
