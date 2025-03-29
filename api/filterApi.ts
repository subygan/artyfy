import { ApiClient } from './apiClient';

export interface FilterSettings {
  type: string;
  params: Record<string, any>;
}

export interface FilterResponse {
  id: string;
  user_id: string;
  name: string;
  description: string;
  settings: FilterSettings;
  is_default: boolean;
  is_public: boolean;
  example_image_url: string;
  popularity: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFilterRequest {
  name: string;
  description?: string;
  settings: FilterSettings | string; // Can be string when sending as form data
  is_public?: boolean;
  example_image?: File; // For web or ReactNative's ImagePicker result
}

export interface UpdateFilterRequest {
  name?: string;
  description?: string;
  settings?: FilterSettings;
  is_public?: boolean;
  example_image_url?: string;
}

export interface ProcessedImageResponse {
  id: string;
  image_id: string;
  filter_id: string;
  processed_url: string;
  original_url: string;
  created_at: string;
}

/**
 * API service for filter-related endpoints
 */
export class FilterApi {
  /**
   * Get all filters accessible to the user
   */
  static async getAllFilters(): Promise<FilterResponse[]> {
    return ApiClient.get<FilterResponse[]>('/api/filters');
  }

  /**
   * Create a new custom filter
   * @param filterData Filter data to create
   * @param exampleImage Optional example image file
   */
  static async createFilter(filterData: CreateFilterRequest): Promise<FilterResponse> {
    // If we have an example image, use FormData
    if (filterData.example_image) {
      const formData = new FormData();
      formData.append('name', filterData.name);
      
      if (filterData.description) {
        formData.append('description', filterData.description);
      }
      
      // If settings is an object, convert to JSON string
      if (typeof filterData.settings === 'object') {
        formData.append('settings', JSON.stringify(filterData.settings));
      } else {
        formData.append('settings', filterData.settings);
      }
      
      if (filterData.is_public !== undefined) {
        formData.append('is_public', filterData.is_public.toString());
      }
      
      // Append the example image
      formData.append('example_image', filterData.example_image);
      
      return ApiClient.post<FilterResponse>('/api/filters', formData, true, true);
    } else {
      // Regular JSON request if no image
      return ApiClient.post<FilterResponse>('/api/filters', filterData);
    }
  }

  /**
   * Get a specific filter by ID
   */
  static async getFilterById(filterId: string): Promise<FilterResponse> {
    return ApiClient.get<FilterResponse>(`/api/filters/${filterId}`);
  }

  /**
   * Update an existing filter
   */
  static async updateFilter(filterId: string, updateData: UpdateFilterRequest): Promise<FilterResponse> {
    return ApiClient.put<FilterResponse>(`/api/filters/${filterId}`, updateData);
  }

  /**
   * Delete a filter
   */
  static async deleteFilter(filterId: string): Promise<{ message: string }> {
    return ApiClient.delete<{ message: string }>(`/api/filters/${filterId}`);
  }

  /**
   * Get processed images for a specific filter
   */
  static async getProcessedImagesByFilter(filterId: string): Promise<ProcessedImageResponse[]> {
    return ApiClient.get<ProcessedImageResponse[]>(`/api/filters/${filterId}/processed-images`);
  }
}
