// src/Services/attendanceAPI.js - Production Ready
import { apiClient } from './apiClient';

export const attendanceAPI = {
  // Get all attendance records
  getAttendanceRecords: async (filters = {}) => {
    try {
      const response = await apiClient.get('/attendance', { params: filters });
      return {
        success: true,
        data: response.data.data,
        message: 'Attendance records retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch attendance records'
      };
    }
  },

  // Get attendance record by ID
  getAttendanceById: async (id) => {
    try {
      const response = await apiClient.get(`/attendance/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Attendance record retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch attendance record'
      };
    }
  },

  // Create new attendance record
  createAttendance: async (attendanceData) => {
    try {
      const response = await apiClient.post('/attendance', attendanceData);
      return {
        success: true,
        data: response.data.data,
        message: 'Attendance recorded successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to record attendance'
      };
    }
  },

  // Update attendance record
  updateAttendance: async (id, attendanceData) => {
    try {
      const response = await apiClient.put(`/attendance/${id}`, attendanceData);
      return {
        success: true,
        data: response.data.data,
        message: 'Attendance updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update attendance'
      };
    }
  },

  // Delete attendance record
  deleteAttendance: async (id) => {
    try {
      await apiClient.delete(`/attendance/${id}`);
      return {
        success: true,
        message: 'Attendance record deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete attendance record'
      };
    }
  },

  // Get attendance statistics
  getAttendanceStats: async (period = 'month') => {
    try {
      const response = await apiClient.get(`/attendance/stats?period=${period}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Attendance statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch attendance statistics'
      };
    }
  },

  // Get service types
  getServiceTypes: async () => {
    try {
      const response = await apiClient.get('/attendance/service-types');
      return {
        success: true,
        data: response.data.data,
        message: 'Service types retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch service types'
      };
    }
  },

  // Get members for attendance marking
  getMembersForAttendance: async () => {
    try {
      const response = await apiClient.get('/attendance/members');
      return {
        success: true,
        data: response.data.data,
        message: 'Members retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch members'
      };
    }
  },

  // Generate attendance report
  generateReport: async (filters = {}) => {
    try {
      const response = await apiClient.post('/attendance/report', filters, {
        responseType: 'blob'
      });

      const filename = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
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
        message: 'Report generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate report'
      };
    }
  }
};