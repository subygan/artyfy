import { getAuth } from 'firebase/auth';

const API_BASE_URL = 'https://dbc8-142-154-218-138.ngrok-free.app';

/**
 * Base API client that handles common functionality for all API requests
 */
export class ApiClient {
  /**
   * Get the current Firebase authentication token
   */
  static async getAuthToken(): Promise<string | null> {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return null;
    }
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Make an authenticated request to the API
   */
  static async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    requiresAuth: boolean = true,
    isFormData: boolean = false
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {};
    
    // Add authentication header if required
    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required for this request');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Set content type based on whether we're sending form data or JSON
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
    };
    
    // Add body data if provided
    if (data) {
      if (isFormData && data instanceof FormData) {
        options.body = data;
      } else if (!isFormData) {
        options.body = JSON.stringify(data);
      }
    }
    
    // Make the request
    try {
      const response = await fetch(url, options);
      
      // Handle non-success responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }
      
      // Parse and return the response
      return await response.json();
    } catch (error) {
      console.error(`API ${method} request to ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  // Convenience methods for different HTTP verbs
  static async get<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, requiresAuth);
  }
  
  static async post<T>(endpoint: string, data: any, requiresAuth: boolean = true, isFormData: boolean = false): Promise<T> {
    return this.request<T>(endpoint, 'POST', data, requiresAuth, isFormData);
  }
  
  static async put<T>(endpoint: string, data: any, requiresAuth: boolean = true, isFormData: boolean = false): Promise<T> {
    return this.request<T>(endpoint, 'PUT', data, requiresAuth, isFormData);
  }
  
  static async delete<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, requiresAuth);
  }
}
