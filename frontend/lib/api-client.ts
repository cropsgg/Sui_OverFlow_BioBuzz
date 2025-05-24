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
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// DAO specific interfaces matching backend
interface DaoInfoResponse {
  daoObjectId: string;
  name: string;
  description: string;
  adminSuiAddress: string;
  memberCount: number;
  treasuryBalance: number;
  totalProposals: number;
  totalDataRecords: number;
  activeProposals: number;
}

interface MemberResponse {
  suiAddress: string;
  name: string;
  joinedAt: Date;
  votingPower: number;
  isDaoMember: boolean;
  totalDataSubmissions?: number;
  totalVotesCast?: number;
}

interface ProposalResponse {
  proposalObjectId: string;
  proposalSequentialId: number;
  type: number;
  typeLabel: string;
  title: string;
  description: string;
  proposerSuiAddress: string;
  proposerName?: string;
  createdAt: Date;
  votingEndTime: Date;
  executed: boolean;
  approved?: boolean;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  voterCount: number;
  isActive: boolean;
  canVote?: boolean;
  userVote?: boolean | null;
  dataReference?: {
    recordId: string;
    sensorType: number;
    value: number;
    metadata: string;
  };
}

interface DataRecordResponse {
  dataRecordObjectId: string;
  dataSequentialId: number;
  sensorType: number;
  sensorTypeName: string;
  submittedBySuiAddress: string;
  submitterName?: string;
  dataHash: string;
  metadata: string;
  timestamp: Date;
  value: number;
  triggeredAlert: boolean;
  alertProposal?: {
    proposalId: string;
    title: string;
    status: string;
  };
  thresholdConfig?: {
    minValue: number;
    maxValue: number;
    description: string;
  };
}

interface DashboardStatsResponse {
  totalMembers: number;
  totalProposals: number;
  activeProposals: number;
  totalDataRecords: number;
  recentAlerts: number;
  treasuryBalance: number;
  membershipGrowth: Array<{
    date: string;
    count: number;
  }>;
  proposalActivity: Array<{
    date: string;
    created: number;
    executed: number;
  }>;
  dataSubmissionTrends: Array<{
    date: string;
    submissions: number;
    alerts: number;
  }>;
}

interface SensorType {
  sensorTypeId: number;
  name: string;
  isActive: boolean;
}

interface ThresholdConfig {
  sensorTypeId: number;
  sensorTypeName: string;
  minValue: number;
  maxValue: number;
  description: string;
  updatedAt: Date;
}

interface TransactionResponse {
  transactionBlock: any;
  digest?: string;
  effects?: any;
}

// Generic error handling for API calls
const handleApiError = (error: any): ApiResponse => {
  console.error('API Error:', error);
  return {
    success: false,
    message: error.message || 'Network error. Please check your connection and try again.',
  };
};

// Request helper with credentials
const makeRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
};

// Auth API endpoints
export const authApi = {
  // Check if email exists
  checkEmailExists: async (email: string): Promise<ApiResponse> => {
    try {
      const response = await makeRequest(`${API_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Check if email is verified
  checkEmailVerification: async (email: string): Promise<ApiResponse> => {
    try {
      const response = await makeRequest(`${API_URL}/auth/check-verification`, {
        method: 'POST',
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
      const response = await makeRequest(`${API_URL}/auth/check-username?username=${encodeURIComponent(username)}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Resend verification email
  resendVerificationEmail: async (email: string): Promise<ApiResponse> => {
    try {
      const response = await makeRequest(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
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
      const response = await makeRequest(`${API_URL}/auth/register`, {
        method: 'POST',
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
      const response = await makeRequest(`${API_URL}/auth/login`, {
        method: 'POST',
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
      const response = await makeRequest(`${API_URL}/auth/logout`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await makeRequest(`${API_URL}/auth/me`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Verify email
  verifyEmail: async (token: string): Promise<ApiResponse> => {
    try {
      const response = await makeRequest(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    try {
      const response = await makeRequest(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
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
      const response = await makeRequest(`${API_URL}/auth/reset-password?token=${encodeURIComponent(token)}`, {
        method: 'PUT',
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
      const response = await makeRequest(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// DAO API endpoints
export const daoApi = {
  // ===== INITIALIZATION =====
  
  // Initialize DAO
  initialize: async (data: { name: string; description: string; adminAddress: string }): Promise<ApiResponse> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/initialize`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ===== DAO INFO =====
  
  // Get DAO info
  getInfo: async (): Promise<ApiResponse<DaoInfoResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/info`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get dashboard stats
  getDashboardStats: async (): Promise<ApiResponse<DashboardStatsResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/dashboard`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ===== MEMBER MANAGEMENT =====
  
  // Link Sui address
  linkSuiAddress: async (suiAddress: string): Promise<ApiResponse> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/members/link-address`, {
        method: 'POST',
        body: JSON.stringify({ suiAddress }),
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Add member (Admin only)
  addMember: async (data: { suiAddress: string; memberName: string }): Promise<ApiResponse<TransactionResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/admin/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get members with filtering and pagination
  getMembers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'name' | 'joinedAt' | 'votingPower';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<MemberResponse[]>> => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
      
      const response = await makeRequest(`${API_URL}/dao/members?${searchParams}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get member by address
  getMemberByAddress: async (address: string): Promise<ApiResponse<MemberResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/members/${address}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get user DAO status
  getUserDaoStatus: async (): Promise<ApiResponse<{
    hasLinkedAddress: boolean;
    isDaoMember: boolean;
    suiAddress: string | null;
    memberDetails: any;
  }>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/user/status`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ===== DATA SUBMISSION =====
  
  // Submit data
  submitData: async (data: {
    sensorType: number;
    dataHash: string;
    metadata: string;
    value: number;
  }): Promise<ApiResponse<TransactionResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/data`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get data records with filtering
  getDataRecords: async (params: {
    page?: number;
    limit?: number;
    sensorType?: number;
    submittedBy?: string;
    triggeredAlert?: boolean;
    dateFrom?: string;
    dateTo?: string;
    valueMin?: number;
    valueMax?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<DataRecordResponse[]>> => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
      
      const response = await makeRequest(`${API_URL}/dao/data?${searchParams}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get data record by ID
  getDataRecordById: async (recordId: string): Promise<ApiResponse<DataRecordResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/data/${recordId}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ===== PROPOSALS =====
  
  // Create proposal
  createProposal: async (data: {
    title: string;
    description: string;
    proposalType: number;
  }): Promise<ApiResponse<TransactionResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/proposals`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get proposals with filtering
  getProposals: async (params: {
    page?: number;
    limit?: number;
    type?: number;
    status?: string;
    proposer?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<ProposalResponse[]>> => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
      
      const response = await makeRequest(`${API_URL}/dao/proposals?${searchParams}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get proposal by ID
  getProposalById: async (proposalId: string): Promise<ApiResponse<ProposalResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/proposals/${proposalId}`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Vote on proposal
  vote: async (proposalId: string, vote: boolean): Promise<ApiResponse<TransactionResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/proposals/${proposalId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote }),
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Execute proposal
  executeProposal: async (proposalId: string): Promise<ApiResponse<TransactionResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/proposals/${proposalId}/execute`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ===== ADMIN =====
  
  // Update threshold (Admin only)
  updateThreshold: async (sensorTypeId: number, data: {
    minValue: number;
    maxValue: number;
    description: string;
  }): Promise<ApiResponse<TransactionResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/admin/thresholds/${sensorTypeId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get thresholds
  getThresholds: async (): Promise<ApiResponse<ThresholdConfig[]>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/thresholds`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get sensor types
  getSensorTypes: async (): Promise<ApiResponse<SensorType[]>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/sensor-types`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ===== TREASURY =====
  
  // Add funds to treasury
  addFunds: async (amount: number): Promise<ApiResponse<TransactionResponse>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/treasury/add-funds`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get treasury balance
  getTreasuryBalance: async (): Promise<ApiResponse<{ balance: number; daoObjectId: string }>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/treasury/balance`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ===== EVENT LISTENER =====
  
  // Get event listener status
  getEventListenerStatus: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/events/status`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Start event listener (Admin only)
  startEventListener: async (): Promise<ApiResponse> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/admin/events/start`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Stop event listener (Admin only)
  stopEventListener: async (): Promise<ApiResponse> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/admin/events/stop`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Sync events (Admin only)
  syncEvents: async (hours?: number): Promise<ApiResponse> => {
    try {
      const searchParams = hours ? `?hours=${hours}` : '';
      const response = await makeRequest(`${API_URL}/dao/admin/events/sync${searchParams}`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ===== HEALTH CHECK =====
  
  // Health check
  health: async (): Promise<ApiResponse> => {
    try {
      const response = await makeRequest(`${API_URL}/dao/health`);
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
}; 