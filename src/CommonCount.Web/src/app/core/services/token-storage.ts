import { Service } from '@angular/core';

const TOKEN_KEY = 'auth_token';
const DISPLAY_NAME_KEY = 'display_name';

@Service()
export class TokenStorage {
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  setDisplayName(displayName: string) {
    localStorage.setItem(DISPLAY_NAME_KEY, displayName);
  }

  getDisplayName(): string | null {
    return localStorage.getItem(DISPLAY_NAME_KEY);
  }

  removeDisplayName() {
    localStorage.removeItem(DISPLAY_NAME_KEY);
  }

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
