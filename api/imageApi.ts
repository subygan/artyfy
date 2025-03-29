import { ApiClient } from './apiClient';

export interface ImageResponse {
  id: string;
  user_id: string;
  original_url: string;
  created_at: string;
  updated_at: string;
}

export interface CreateImageRequest {
  original_url: string;
}

/**
 * API service for image-related endpoints
 */
export class ImageApi {
  /**
   * Upload a new image record
   * Note: This only creates the database record, actual file upload is handled separately
   */
  static async uploadImage(imageData: CreateImageRequest): Promise<ImageResponse> {
    return ApiClient.post<ImageResponse>('/api/images', imageData);
  }

  /**
   * Get all images uploaded by the current user
   */
  static async getUserImages(): Promise<ImageResponse[]> {
    return ApiClient.get<ImageResponse[]>('/api/images');
  }
}
