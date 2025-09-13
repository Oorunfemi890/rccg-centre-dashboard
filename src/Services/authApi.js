// src/Services/authApi.js - Enhanced with profile management
import { apiClient } from './apiClient';

export const authAPI = {
  // Login admin
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });
      
      // Handle different response structures
      if (response.data) {
        // Check if response has success field or assume success if we get data
        const isSuccess = response.data.success !== false && (response.data.success || response.data.data || response.data.user);
        
        if (isSuccess) {
          // Extract data from different possible structures
          const responseData = response.data.data || response.data;
          
          return {
            success: true,
            data: {
              admin: responseData.user || responseData.admin || responseData,
              accessToken: responseData.accessToken || responseData.token,
              token: responseData.accessToken || responseData.token,
              refreshToken: responseData.refreshToken,
              user: responseData.user || responseData.admin || responseData
            },
            message: response.data.message || 'Login successful'
          };
        }
      }
      
      return {
        success: false,
        message: response.data?.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error structures
      let errorMessage = 'Login failed';
      
      if (error.response?.data) {
        errorMessage = error.response.data.message || 
                     error.response.data.error || 
                     (Array.isArray(error.response.data.errors) ? 
                       error.response.data.errors.join(', ') : 
                       errorMessage);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error
      };
    }
  },

  // Verify token
  verifyToken: async (token) => {
    try {
      const response = await apiClient.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        const isSuccess = response.data.success !== false;
        
        if (isSuccess) {
          const responseData = response.data.data || response.data;
          
          return {
            success: true,
            data: {
              admin: responseData.user || responseData.admin || responseData,
              user: responseData.user || responseData.admin || responseData,
              valid: true
            },
            message: response.data.message || 'Token valid'
          };
        }
      }
      
      return {
        success: false,
        message: response.data?.message || 'Token verification failed'
      };
    } catch (error) {
      console.error('Token verification error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Token verification failed'
      };
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await apiClient.post('/auth/refresh', {}, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        const isSuccess = response.data.success !== false;
        
        if (isSuccess) {
          const responseData = response.data.data || response.data;
          
          return {
            success: true,
            data: {
              admin: responseData.user || responseData.admin,
              user: responseData.user || responseData.admin,
              accessToken: responseData.accessToken || responseData.token,
              token: responseData.accessToken || responseData.token,
              refreshToken: responseData.refreshToken || refreshToken
            },
            message: response.data.message || 'Token refreshed successfully'
          };
        }
      }

      return {
        success: false,
        message: response.data?.message || 'Token refresh failed'
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Token refresh failed'
      };
    }
  },

  // Logout
  logout: async (refreshToken) => {
    try {
      const response = await apiClient.post('/auth/logout', {}, {
        headers: {
          'Authorization': `Bearer ${refreshToken || localStorage.getItem('churchAdminRefreshToken')}`
        }
      });
      
      return {
        success: true,
        message: response.data?.message || 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Don't fail logout on API error - always return success for logout
      return {
        success: true,
        message: 'Logged out successfully'
      };
    }
  },

  // Request profile update token
  requestProfileUpdate: async (type) => {
    try {
      const response = await apiClient.post('/auth/request-profile-update', {
        type: type // 'email' or 'profile'
      });
      
      return {
        success: true,
        message: response.data?.message || 'Verification token sent to your email'
      };
    } catch (error) {
      console.error('Request profile update error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to request profile update'
      };
    }
  },

  // Update profile with token verification
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/auth/profile', {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        position: profileData.position,
        token: profileData.token // Include verification token if provided
      });
      
      if (response.data) {
        const isSuccess = response.data.success !== false;
        
        if (isSuccess) {
          const responseData = response.data.data || response.data;
          
          return {
            success: true,
            data: {
              admin: responseData.user || responseData.admin || responseData,
              user: responseData.user || responseData.admin || responseData
            },
            message: response.data.message || 'Profile updated successfully'
          };
        }
      }
      
      return {
        success: false,
        message: response.data?.message || 'Profile update failed'
      };
    } catch (error) {
      console.error('Profile update error:', error);
      
      let errorMessage = 'Profile update failed';
      
      if (error.response?.data) {
        errorMessage = error.response.data.message || 
                     error.response.data.error ||
                     (Array.isArray(error.response.data.errors) ? 
                       error.response.data.errors.join(', ') : 
                       errorMessage);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Verify profile update token
  verifyProfileToken: async (token) => {
    try {
      const response = await apiClient.post('/auth/verify-profile-token', {
        token: token
      });
      
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || 'Token verified successfully'
      };
    } catch (error) {
      console.error('Verify profile token error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Token verification failed'
      };
    }
  },

  // Request password change token
  requestPasswordChange: async (currentPassword) => {
    try {
      const response = await apiClient.post('/auth/request-password-change', {
        currentPassword: currentPassword
      });
      
      return {
        success: true,
        message: response.data?.message || 'Password change verification token sent to your email'
      };
    } catch (error) {
      console.error('Request password change error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to request password change'
      };
    }
  },

  // Change password with token verification
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.put('/auth/change-password', {
        token: passwordData.token,
        newPassword: passwordData.newPassword
      });
      
      return {
        success: true,
        message: response.data?.message || 'Password changed successfully'
      };
    } catch (error) {
      console.error('Password change error:', error);
      
      let errorMessage = 'Password change failed';
      
      if (error.response?.data) {
        errorMessage = error.response.data.message || 
                     error.response.data.error ||
                     (Array.isArray(error.response.data.errors) ? 
                       error.response.data.errors.join(', ') : 
                       errorMessage);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Verify password change token
  verifyPasswordToken: async (token) => {
    try {
      const response = await apiClient.post('/auth/verify-password-token', {
        token: token
      });
      
      return {
        success: true,
        message: response.data?.message || 'Token verified successfully'
      };
    } catch (error) {
      console.error('Verify password token error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Token verification failed'
      };
    }
  },

  // Get admin profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      
      if (response.data) {
        const isSuccess = response.data.success !== false;
        
        if (isSuccess) {
          const responseData = response.data.data || response.data;
          
          return {
            success: true,
            data: {
              admin: responseData.user || responseData.admin || responseData,
              user: responseData.user || responseData.admin || responseData
            },
            message: response.data.message || 'Profile retrieved successfully'
          };
        }
      }
      
      return {
        success: false,
        message: response.data?.message || 'Failed to get profile'
      };
    } catch (error) {
      console.error('Get profile error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to get profile'
      };
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: email
      });
      
      return {
        success: true,
        message: response.data?.message || 'Password reset email sent'
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to request password reset'
      };
    }
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token: token,
        newPassword: newPassword
      });
      
      return {
        success: true,
        message: response.data?.message || 'Password reset successfully'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to reset password'
      };
    }
  }
};