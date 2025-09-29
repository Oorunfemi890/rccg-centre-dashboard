import React, { createContext, useContext, useReducer, useEffect } from "react";
import { toast } from "react-toastify";
import { authAPI } from "@/Services/authApi";

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isAuthenticated: true,
        admin: action.payload.admin,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        loading: false,
        error: null,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        admin: null,
        token: null,
        refreshToken: null,
        loading: false,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "UPDATE_PROFILE":
      return { ...state, admin: { ...state.admin, ...action.payload } };
    case "TOKEN_REFRESHED":
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        admin: action.payload.admin || state.admin,
      };
    case "SET_PROFILE_UPDATE_STATUS":
      return {
        ...state,
        profileUpdateStatus: action.payload
      };
    case "SET_PASSWORD_CHANGE_STATUS":
      return {
        ...state,
        passwordChangeStatus: action.payload
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  isAuthenticated: false,
  admin: null,
  token: null,
  refreshToken: null,
  loading: true, // Start with loading true for initial auth check
  error: null,
  profileUpdateStatus: null, // 'requesting', 'pending', 'verified', 'failed'
  passwordChangeStatus: null, // 'requesting', 'pending', 'verified', 'failed'
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("churchAdminToken");
      const refreshToken = localStorage.getItem("churchAdminRefreshToken");

      if (token && refreshToken) {
        try {
          dispatch({ type: "SET_LOADING", payload: true });

          // Verify token with backend
          const response = await authAPI.verifyToken(token);

          if (response.success && response.data) {
            dispatch({
              type: "LOGIN_SUCCESS",
              payload: {
                admin: response.data.user || response.data.admin,
                token: token,
                refreshToken: refreshToken,
              },
            });
          } else {
            // Try to refresh token
            const refreshResponse = await authAPI.refreshToken(refreshToken);

            if (refreshResponse.success && refreshResponse.data) {
              const newToken =
                refreshResponse.data.accessToken || refreshResponse.data.token;
              const newRefreshToken =
                refreshResponse.data.refreshToken || refreshToken;

              localStorage.setItem("churchAdminToken", newToken);
              localStorage.setItem("churchAdminRefreshToken", newRefreshToken);

              dispatch({
                type: "LOGIN_SUCCESS",
                payload: {
                  admin:
                    refreshResponse.data.user || refreshResponse.data.admin,
                  token: newToken,
                  refreshToken: newRefreshToken,
                },
              });
            } else {
              // Tokens are invalid, logout
              logout(false); // Don't call API during initialization
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          logout(false); // Don't call API during initialization
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    checkAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    let refreshInterval;

    if (state.isAuthenticated && state.token && state.refreshToken) {
      // Refresh token every 14 minutes (assuming 15min expiry)
      refreshInterval = setInterval(async () => {
        try {
          const response = await authAPI.refreshToken(state.refreshToken);

          if (response.success && response.data) {
            const newToken = response.data.accessToken || response.data.token;
            const newRefreshToken =
              response.data.refreshToken || state.refreshToken;

            localStorage.setItem("churchAdminToken", newToken);
            localStorage.setItem("churchAdminRefreshToken", newRefreshToken);

            dispatch({
              type: "TOKEN_REFRESHED",
              payload: {
                token: newToken,
                refreshToken: newRefreshToken,
                admin: response.data.user || response.data.admin,
              },
            });
          } else {
            logout(true);
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          logout(true);
        }
      }, 14 * 60 * 1000); // 14 minutes
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [state.isAuthenticated, state.token, state.refreshToken]);

  // Listen for auth logout events (from apiClient)
  useEffect(() => {
    const handleAuthLogout = () => {
      logout(false);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const response = await authAPI.login(credentials);

      if (response.success && response.data) {
        const admin = response.data.user || response.data.admin;
        const token = response.data.accessToken || response.data.token;
        const refreshToken = response.data.refreshToken;

        if (!admin || !token || !refreshToken) {
          throw new Error("Invalid response format from server");
        }

        // Store tokens in localStorage
        localStorage.setItem("churchAdminToken", token);
        localStorage.setItem("churchAdminRefreshToken", refreshToken);

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { admin, token, refreshToken },
        });

        toast.success(response.message || "Login successful!");
        return { success: true, data: response.data };
      } else {
        const error = response.message || "Login failed";
        dispatch({ type: "SET_ERROR", payload: error });
        return { success: false, message: error };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = async (callAPI = true) => {
    try {
      if (callAPI && state.refreshToken) {
        await authAPI.logout(state.refreshToken);
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Clear localStorage and state regardless of API call result
      localStorage.removeItem("churchAdminToken");
      localStorage.removeItem("churchAdminRefreshToken");

      dispatch({ type: "LOGOUT" });

      if (callAPI) {
        toast.info("You have been logged out");
      }
    }
  };

  // Request profile update token
  const requestProfileUpdate = async (type = 'email') => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: 'requesting' });

      const response = await authAPI.requestProfileUpdate(type);

      if (response.success) {
        dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: 'pending' });
        toast.success(response.message || "Verification token sent to your email");
        return { success: true };
      } else {
        dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: 'failed' });
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to request profile update";
      dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: 'failed' });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Update profile with token verification
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // FIXED: Log the data being sent for debugging
      console.log('Updating profile with data:', {
        ...profileData,
        token: profileData.token ? `${profileData.token.substring(0, 10)}...` : 'none'
      });

      const response = await authAPI.updateProfile(profileData);

      if (response.success && response.data) {
        const updatedAdmin =
          response.data.admin || response.data.user || response.data;

        dispatch({
          type: "UPDATE_PROFILE",
          payload: updatedAdmin,
        });
        
        dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: 'verified' });
        
        toast.success(response.message || "Profile updated successfully!");
        
        // Clear status after a delay
        setTimeout(() => {
          dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: null });
        }, 3000);
        
        return { success: true, data: response.data };
      } else {
        const error = response.message || "Profile update failed";
        dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: 'failed' });
        toast.error(error);
        return { success: false, message: error };
      }
    } catch (error) {
      // FIXED: Enhanced error logging and handling
      console.error('Profile update error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Profile update failed";
      
      dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: 'failed' });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Verify profile update token
  const verifyProfileToken = async (token) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await authAPI.verifyProfileToken(token);

      if (response.success) {
        dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: 'verified' });
        return { success: true, data: response.data };
      } else {
        dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: 'failed' });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Token verification failed";
      dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: 'failed' });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Request password change token
  const requestPasswordChange = async (currentPassword) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: 'requesting' });

      const response = await authAPI.requestPasswordChange(currentPassword);

      if (response.success) {
        dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: 'pending' });
        toast.success(response.message || "Password change verification token sent");
        return { success: true };
      } else {
        dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: 'failed' });
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to request password change";
      dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: 'failed' });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Change password with token verification
  const changePassword = async (passwordData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await authAPI.changePassword({
        token: passwordData.token,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: 'verified' });
        toast.success(response.message || "Password changed successfully!");
        
        // Clear tokens to force re-login with new password
        setTimeout(() => {
          logout(false);
        }, 2000);
        
        return { success: true };
      } else {
        const error = response.message || "Password change failed";
        dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: 'failed' });
        toast.error(error);
        return { success: false, message: error };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Password change failed";
      dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: 'failed' });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Verify password change token
  const verifyPasswordToken = async (token) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await authAPI.verifyPasswordToken(token);

      if (response.success) {
        dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: 'verified' });
        return { success: true };
      } else {
        dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: 'failed' });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Token verification failed";
      dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: 'failed' });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Get current token for API calls
  const getToken = () => {
    return state.token || localStorage.getItem("churchAdminToken");
  };

  // Get current refresh token
  const getRefreshToken = () => {
    return (
      state.refreshToken || localStorage.getItem("churchAdminRefreshToken")
    );
  };

  // Refresh profile data
  const refreshProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      
      if (response.success && response.data) {
        const updatedAdmin = response.data.admin || response.data.user;
        
        dispatch({
          type: "UPDATE_PROFILE",
          payload: updatedAdmin,
        });
        
        return { success: true, data: response.data };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error("Profile refresh failed:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || "Failed to refresh profile" 
      };
    }
  };

  const value = {
    ...state,
    login,
    logout,
    updateProfile,
    requestProfileUpdate,
    verifyProfileToken,
    requestPasswordChange,
    changePassword,
    verifyPasswordToken,
    refreshProfile,
    getToken,
    getRefreshToken,
    clearError: () => dispatch({ type: "CLEAR_ERROR" }),
    clearProfileUpdateStatus: () => dispatch({ type: "SET_PROFILE_UPDATE_STATUS", payload: null }),
    clearPasswordChangeStatus: () => dispatch({ type: "SET_PASSWORD_CHANGE_STATUS", payload: null }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};