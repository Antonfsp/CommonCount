export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  displayName: string;
}
