const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  user?: T;
  isProfileCompleted?: boolean;
  userRewards?: any;
  userStatus?: any;
  spots?: any[];
  spot?: any;
  posts?: any[];
  post?: any;
  totalCount?: number;
  page?: number;
  totalPages?: number;
  limit?: number;
  isLiked?: boolean;
  likeCount?: number;
  errors?: Array<{ field?: string; message: string }>;
}

export interface SignUpCompletionPayload {
  username: string;
  email: string;
  pincode: string;
  address: string;
  role: 'Civilian' | 'Coordinator' | 'Hybrid';
  geolocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  provider?: 'email' | 'google';
  providerId?: string;
  avatarUrl?: string;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const isFormData = options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData
    ? {}
    : {
        'Content-Type': 'application/json',
      };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Ensures HTTP-only cookies like JWT are sent and stored
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({
      success: response.ok,
      message: response.statusText,
    }));

    if (!response.ok && data.success === undefined) {
      data.success = false;
    }

    return data;
  } catch (error: any) {
    console.error(`API Request Error [${endpoint}]:`, error);
    return {
      success: false,
      message: error?.message || 'Network error. Please ensure the backend server is running.',
    } as ApiResponse<T>;
  }
}

export const authApi = {
  // Get Current Authenticated Session User (Authorized via JWT cookie)
  getMe: () =>
    request('/api/v1/auth/me', {
      method: 'GET',
    }),

  // Sign In Endpoints
  signIn: (email: string) =>
    request('/api/v1/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifySignInOtp: (email: string, otp: string) =>
    request('/api/v1/auth/verify/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resendSignInOtp: (email: string) =>
    request('/api/v1/auth/resend/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Sign Up Endpoints
  signUp: (email: string) =>
    request('/api/v1/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifySignUpOtp: (email: string, otp: string) =>
    request('/api/v1/auth/verify/verify-otp-sign-up', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resendSignUpOtp: (email: string) =>
    request('/api/v1/auth/resend/resend-otp-sign-up', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Profile Completion
  signUpCompletion: async (payload: SignUpCompletionPayload | FormData) => {
    clearSessionProfileCache();
    const isFormData = payload instanceof FormData;
    return request('/api/v1/auth/sign-up-completion', {
      method: 'POST',
      body: isFormData ? payload : JSON.stringify(payload),
    });
  },

  // Sign Out
  signOut: async () => {
    clearSessionProfileCache();
    return request('/api/v1/auth/sign-out', {
      method: 'POST',
    });
  },

  // Google OAuth URL helper
  getGoogleAuthUrl: () => `${API_BASE_URL}/api/v1/auth/google`,
};

export interface ProfileResponse<T = any> extends ApiResponse<T> {
  user?: any;
  userRewards?: any;
  userStatus?: any;
}

export const clearSessionProfileCache = () => {
  // Session storage caching removed
};

export const profileApi = {
  getMyProfile: async () => {
    return request<ProfileResponse>('/api/v1/profile/get-my-profile', {
      method: 'GET',
    });
  },

  getFullProfile: async () => {
    return profileApi.getMyProfile();
  },

  getBasicInfo: async () => {
    return request<ProfileResponse>('/api/v1/profile/basic-info', {
      method: 'GET',
    });
  },

  getProfileById: async (id: string) => {
    return request<ProfileResponse>(`/api/v1/profile/${id}`, {
      method: 'GET',
    });
  },

  getUserHistory: async () => {
    return request<ApiResponse>('/api/v1/profile/history', {
      method: 'GET',
    });
  },

  clearCache: clearSessionProfileCache,
};

export const spotsApi = {
  getAllSpots: async (params?: { lat?: number; lng?: number; radius?: number }) => {
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.lat !== undefined) searchParams.append('lat', String(params.lat));
      if (params.lng !== undefined) searchParams.append('lng', String(params.lng));
      if (params.radius !== undefined) searchParams.append('radius', String(params.radius));
      queryString = `?${searchParams.toString()}`;
    }
    return request(`/api/v1/spots${queryString}`, {
      method: 'GET',
    });
  },

  getSpotById: async (id: string) => {
    return request(`/api/v1/spots/${id}`, {
      method: 'GET',
    });
  },

  createSpot: async (formData: FormData) => {
    return request('/api/v1/spots', {
      method: 'POST',
      body: formData,
    });
  },

  assignSpot: async (spotId: string) => {
    return request(`/api/v1/spots/${spotId}/assign`, {
      method: 'PATCH',
    });
  },

  completeSpot: async (spotId: string, formData?: FormData) => {
    if (formData) {
      return request(`/api/v1/spots/${spotId}/complete`, {
        method: 'PATCH',
        body: formData,
      });
    }
    return request(`/api/v1/spots/${spotId}/complete`, {
      method: 'PATCH',
    });
  },
};

export interface FeedPost {
  _id: string;
  postName?: string;
  SpotedUser?: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string | { url?: string; id?: string };
    role?: string;
  };
  CleanedUser?: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string | { url?: string; id?: string };
    role?: string;
  };
  description?: string;
  imageBefore?: string;
  imageAfter?: string;
  geolocation?: {
    type?: string;
    address?: string;
    coordinates?: [number, number];
  };
  likeCount?: number;
  createdAt?: string;
}

export interface FeedsResponse extends ApiResponse {
  posts?: FeedPost[];
  post?: FeedPost;
  totalCount?: number;
  page?: number;
  totalPages?: number;
  limit?: number;
  isLiked?: boolean;
  likeCount?: number;
}

export const feedsApi = {
  getAllPosts: async (page: number = 1, limit: number = 10, userId?: string) => {
    const searchParams = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (userId) {
      searchParams.append('userId', userId);
    }
    return request<FeedsResponse>(`/api/v1/feeds?${searchParams.toString()}`, {
      method: 'GET',
    });
  },

  getPostById: async (id: string, userId?: string) => {
    const queryString = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return request<FeedsResponse>(`/api/v1/feeds/${id}${queryString}`, {
      method: 'GET',
    });
  },

  toggleLike: async (id: string, userId?: string) => {
    return request<FeedsResponse>(`/api/v1/feeds/${id}/like`, {
      method: 'POST',
      body: userId ? JSON.stringify({ userId }) : undefined,
    });
  },
};

export default authApi;

