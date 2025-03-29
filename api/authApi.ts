import { ApiClient } from './apiClient';

export interface RegisterUserRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterUserResponse {
  message: string;
  user_id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
}

export interface LoginResponse {
  message: string;
  email: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  user_id: string;
  email: string;
  name: string;
  email_verified: boolean;
  db_user_id: string;
}

export interface UserInfoResponse {
  firebase_uid: string;
  db_user_id: string;
  email: string;
  name: string;
  email_verified: boolean;
  created_at: string;
}

/**
 * API service for authentication endpoints
 */
export class AuthApi {
  /**
   * Register a new user in both Firebase and the Artyfy database
   */
  static async register(userData: RegisterUserRequest): Promise<RegisterUserResponse> {
    return ApiClient.post<RegisterUserResponse>('/auth/register', userData, false);
  }

  /**
   * Login for API testing (Note: normally, Firebase SDK is used for authentication)
   */
  static async login(email: string): Promise<LoginResponse> {
    return ApiClient.post<LoginResponse>('/auth/login', { email }, false);
  }

  /**
   * Verify a Firebase token and return user information
   */
  static async verifyToken(token: string): Promise<VerifyTokenResponse> {
    return ApiClient.post<VerifyTokenResponse>('/auth/verify-token', { token }, false);
  }

  /**
   * Get current authenticated user's information
   */
  static async getCurrentUser(): Promise<UserInfoResponse> {
    return ApiClient.get<UserInfoResponse>('/auth/me');
  }
}
