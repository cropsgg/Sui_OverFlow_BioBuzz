/**
 * API Client for interacting with the backend services
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  password: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  emailSent?: boolean;
  verified?: boolean;
}

// Generic error handling for API calls
const handleApiError = (error: any): ApiResponse => {
  console.error('API Error:', error);
  return {
    success: false,
    message: error.message || 'Network error. Please check your connection and try again.',
  };
};

// Auth API endpoints
export const authApi = {
  // Check if email exists
  checkEmailExists: async (email: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Check if email is verified
  checkEmailVerification: async (email: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/check-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Check if username exists
  checkUsernameExists: async (username: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/check-username?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Resend verification email
  resendVerificationEmail: async (email: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Register a new user
  register: async (userData: RegisterData): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Login user
  login: async (loginData: LoginData): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify(loginData),
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Logout user
  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'GET',
        credentials: 'include',
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Verify email
  verifyEmail: async (token: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: 'GET',
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Reset password
  resetPassword: async (token: string, data: ResetPasswordData): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password?token=${encodeURIComponent(token)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
}; 