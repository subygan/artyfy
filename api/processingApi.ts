import { ApiClient } from './apiClient';

export interface ProcessImageRequest {
  filter_id: string;
  image_ids: string[];
}

export interface ProcessingJobResponse {
  job_id: string;
  user_id: string;
  filter_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  image_count: number;
  completed_count: number;
  created_at: string;
  updated_at: string;
}

export interface FilteredImageStatus {
  id: string;
  original_url: string;
  result_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ProcessingJobDetailsResponse extends ProcessingJobResponse {
  images: FilteredImageStatus[];
}

/**
 * API service for processing-related endpoints
 */
export class ProcessingApi {
  /**
   * Create a filter job to process one or more images with a selected filter
   */
  static async processImages(processData: ProcessImageRequest): Promise<ProcessingJobResponse> {
    return ApiClient.post<ProcessingJobResponse>('/api/process', processData);
  }

  /**
   * Get all filter jobs created by the current user
   */
  static async getUserJobs(): Promise<ProcessingJobResponse[]> {
    return ApiClient.get<ProcessingJobResponse[]>('/api/jobs');
  }

  /**
   * Get detailed information about a specific filter job
   */
  static async getJobDetails(jobId: string): Promise<ProcessingJobDetailsResponse> {
    return ApiClient.get<ProcessingJobDetailsResponse>(`/api/jobs/${jobId}`);
  }
}
