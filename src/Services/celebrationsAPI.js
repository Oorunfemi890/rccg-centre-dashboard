// src/Services/celebrationsAPI.js - Production Ready
import { apiClient } from './apiClient';

export const celebrationsAPI = {
  // Get all celebrations
  getCelebrations: async (filters = {}) => {
    try {
      const response = await apiClient.get('/celebrations', { params: filters });
      return {
        success: true,
        data: response.data.data,
        message: 'Celebrations retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch celebrations'
      };
    }
  },

  // Get celebration by ID
  getCelebrationById: async (id) => {
    try {
      const response = await apiClient.get(`/celebrations/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Celebration details retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch celebration details'
      };
    }
  },

  // Create new celebration (from public form)
  createCelebration: async (celebrationData) => {
    try {
      const response = await apiClient.post('/celebrations', celebrationData);
      return {
        success: true,
        data: response.data.data,
        message: 'Celebration request submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit celebration request'
      };
    }
  },

  // Update celebration status
  updateCelebrationStatus: async (id, statusData) => {
    try {
      const response = await apiClient.patch(`/celebrations/${id}/status`, statusData);
      return {
        success: true,
        data: response.data.data,
        message: 'Celebration status updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update celebration status'
      };
    }
  },

  // Delete celebration
  deleteCelebration: async (id) => {
    try {
      await apiClient.delete(`/celebrations/${id}`);
      return {
        success: true,
        message: 'Celebration deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete celebration'
      };
    }
  },

  // Get celebration statistics
  getCelebrationsStats: async () => {
    try {
      const response = await apiClient.get('/celebrations/stats');
      return {
        success: true,
        data: response.data.data,
        message: 'Celebration statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch celebration statistics'
      };
    }
  },

  // Get upcoming celebrations (for acknowledgment)
  getUpcomingCelebrations: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/celebrations/upcoming?limit=${limit}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Upcoming celebrations retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch upcoming celebrations'
      };
    }
  },

  // Export celebrations
  exportCelebrations: async (format = 'csv', filters = {}) => {
    try {
      const response = await apiClient.get('/celebrations/export', {
        params: { format, ...filters },
        responseType: 'blob'
      });

      const filename = `celebrations_export_${new Date().toISOString().split('T')[0]}.${format}`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        data: { filename },
        message: 'Celebrations exported successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to export celebrations'
      };
    }
  }
};