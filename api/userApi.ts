import { ApiClient } from './apiClient';

export interface UserProfileResponse {
  id: string;
  firebase_uid: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * API service for user-related endpoints
 */
export class UserApi {
  /**
   * Get current user's profile information
   */
  static async getCurrentUserProfile(): Promise<UserProfileResponse> {
    return ApiClient.get<UserProfileResponse>('/api/users/me');
  }
}
