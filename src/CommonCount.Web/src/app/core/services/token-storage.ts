import { Service } from '@angular/core';

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
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

  setUserId(userId: string) {
    localStorage.setItem(USER_ID_KEY, userId);
  }

  getUserId(): string | null {
    return localStorage.getItem(USER_ID_KEY);
  }

  removeDisplayName() {
    localStorage.removeItem(DISPLAY_NAME_KEY);
  }

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  removeUserId() {
    localStorage.removeItem(USER_ID_KEY);
  }

  clear() {
    this.removeToken();
    this.removeDisplayName();
    this.removeUserId();
  }
}
