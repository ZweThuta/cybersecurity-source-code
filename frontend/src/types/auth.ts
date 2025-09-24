export interface User {
  id: string;
  name?: string;
  email: string;
}

export interface LoginResponse {
  // Case 1: MFA required
  mfaRequired?: boolean;
  userId?: string;
  // Case 2: Tokens issued
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
