import { getAuth } from 'firebase/auth';

// Change the API base URL to your current backend endpoint
// If using a local development server, use 'http://localhost:PORT'
// If using ngrok, replace with your current ngrok URL
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
    
    console.log(`Making ${method} request to: ${url}`);
    
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
        console.log('Sending FormData request');
      } else if (!isFormData) {
        options.body = JSON.stringify(data);
        console.log('Request payload:', JSON.stringify(data, null, 2));
      }
    }
    
    // Make the request
    try {
      console.log(`Sending request with options:`, JSON.stringify(options, (key, value) => {
        // Don't log the entire body payload
        if (key === 'body' && typeof value === 'string' && value.length > 100) {
          return value.substring(0, 100) + '... [truncated]';
        }
        return value;
      }, 2));
      
      const response = await fetch(url, options);
      console.log(`Received response with status: ${response.status}`);
      
      // Handle non-success responses
      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Request failed with status ${response.status}`;
        } catch (e) {
          // If we can't parse JSON, try to get text
          const errorText = await response.text().catch(() => 'Unknown error');
          errorMessage = `Request failed with status ${response.status}: ${errorText}`;
        }
        
        console.error('API error response:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse and return the response
      const responseData = await response.json();
      console.log('Response data:', JSON.stringify(responseData).substring(0, 200) + (JSON.stringify(responseData).length > 200 ? '... [truncated]' : ''));
      return responseData;
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
