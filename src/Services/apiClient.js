// src/Services/apiClient.js - Production Ready with localStorage
import axios from "axios";
import { toast } from "react-toastify";

// Base URL for your backend API
const BASE_URL = import.meta.env.VITE_BASE_URL;

// Create axios instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("churchAdminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Track if we're currently refreshing token to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor to handle common errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log response time for debugging
    if (response.config.metadata) {
      const endTime = new Date();
      const duration =
        endTime.getTime() - response.config.metadata.startTime.getTime();
      console.log(
        `API Response: ${response.config.method?.toUpperCase()} ${
          response.config.url
        } - ${duration}ms`
      );
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error.message);
      toast.error("Network error. Please check your internet connection.");
      return Promise.reject(error);
    }

    const { status } = error.response;

    // Handle 401 errors (Unauthorized) with token refresh
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("churchAdminRefreshToken");

        if (refreshToken) {
          console.log("Attempting to refresh token...");

          // Create a new axios instance to avoid interceptors during refresh
          const refreshResponse = await axios.post(
            `${BASE_URL}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
                "Content-Type": "application/json",
              },
              timeout: 10000,
            }
          );

          if (refreshResponse.data) {
            const responseData =
              refreshResponse.data.data || refreshResponse.data;
            const newAccessToken =
              responseData.accessToken || responseData.token;

            if (newAccessToken) {
              // Store the new tokens in localStorage
              localStorage.setItem("churchAdminToken", newAccessToken);
              localStorage.setItem("churchAdminRefreshToken", refreshToken);

              // Process the queue with the new token
              processQueue(null, newAccessToken);

              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return apiClient(originalRequest);
            }
          }
        }

        throw new Error("No valid user for this email or password");
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // Process the queue with error
        processQueue(refreshError, null);

        // Clear tokens and redirect to login
        localStorage.removeItem("churchAdminToken");
        localStorage.removeItem("churchAdminRefreshToken");

        // Dispatch a custom event that the AuthContext can listen to
        window.dispatchEvent(new CustomEvent("auth:logout"));

        // Redirect to login page if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other HTTP errors with appropriate messages
    const errorMessage =
      error.response.data?.message ||
      error.response.data?.error ||
      getDefaultErrorMessage(status);

    switch (status) {
      case 400:
        // Handle validation errors
        if (
          error.response.data?.errors &&
          Array.isArray(error.response.data.errors)
        ) {
          const validationErrors = error.response.data.errors.join(", ");
          toast.error(`Validation Error: ${validationErrors}`);
        } else {
          toast.error(`Bad Request: ${errorMessage}`);
        }
        break;
      case 403:
        toast.error(
          "Access forbidden. You do not have permission to perform this action."
        );
        break;
      case 404:
        toast.error("Resource not found.");
        break;
      case 409:
        toast.error("Conflict: " + errorMessage);
        break;
      case 422:
        // Handle validation errors from Laravel/similar frameworks
        if (error.response.data?.errors) {
          const errors = Object.values(error.response.data.errors).flat();
          toast.error(`Validation Error: ${errors.join(", ")}`);
        } else {
          toast.error("Validation Error: " + errorMessage);
        }
        break;
      case 429:
        toast.error("Too many requests. Please try again later.");
        break;
      case 500:
        toast.error("Internal server error. Please try again later.");
        break;
      case 502:
        toast.error("Bad Gateway. The server is temporarily unavailable.");
        break;
      case 503:
        toast.error("Service temporarily unavailable. Please try again later.");
        break;
      default:
        // Don't show toast for other errors if they have specific handling
        if (status >= 400 && status < 500) {
          console.warn(`Client error ${status}: ${errorMessage}`);
        } else if (status >= 500) {
          toast.error("Server error. Please try again later.");
        }
    }

    return Promise.reject(error);
  }
);

// Helper function to get default error message based on status code
const getDefaultErrorMessage = (status) => {
  const messages = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Validation Error",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };

  return messages[status] || "An error occurred";
};

// Helper function to handle file uploads
export const uploadFile = async (endpoint, file, onUploadProgress = null) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });

    return {
      success: true,
      data: response.data,
      message: response.data?.message || "File uploaded successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || error.message || "File upload failed",
    };
  }
};

// Helper function to download files
export const downloadFile = async (endpoint, filename) => {
  try {
    const response = await apiClient.get(endpoint, {
      responseType: "blob",
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: "File downloaded successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "File download failed",
    };
  }
};

// Export token management functions for use in other parts of the app
export const tokenManager = {
  setTokens: (token, refreshToken) => {
    localStorage.setItem("churchAdminToken", token);
    localStorage.setItem("churchAdminRefreshToken", refreshToken);
  },
  getToken: () => localStorage.getItem("churchAdminToken"),
  getRefreshToken: () => localStorage.getItem("churchAdminRefreshToken"),
  clearTokens: () => {
    localStorage.removeItem("churchAdminToken");
    localStorage.removeItem("churchAdminRefreshToken");
  },
};
