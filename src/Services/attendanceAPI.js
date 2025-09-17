// src/Services/attendanceAPI.js - Updated for seamless backend integration
import { apiClient } from './apiClient';

export const attendanceAPI = {
  // Get all attendance records with filtering and pagination
  getAttendanceRecords: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination parameters
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      
      // Add filter parameters
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.serviceType && filters.serviceType !== 'all') {
        queryParams.append('serviceType', filters.serviceType);
      }
      
      // Add sorting parameters
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      
      const response = await apiClient.get(`/attendance?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
        message: response.data.message || 'Attendance records retrieved successfully'
      };
    } catch (error) {
      console.error('Get attendance records error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch attendance records',
        error: error.response?.data
      };
    }
  },

  // Get attendance record by ID
  getAttendanceById: async (id) => {
    try {
      if (!id) {
        throw new Error('Attendance ID is required');
      }
      
      const response = await apiClient.get(`/attendance/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Attendance record retrieved successfully'
      };
    } catch (error) {
      console.error('Get attendance by ID error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch attendance record',
        error: error.response?.data
      };
    }
  },

  // Create new attendance record
  createAttendance: async (attendanceData) => {
    try {
      // Validate required fields
      if (!attendanceData.date) {
        throw new Error('Date is required');
      }
      if (!attendanceData.serviceType) {
        throw new Error('Service type is required');
      }
      if (attendanceData.totalAttendance === undefined || attendanceData.totalAttendance < 0) {
        throw new Error('Total attendance must be a non-negative number');
      }

      const response = await apiClient.post('/attendance', {
        date: attendanceData.date,
        serviceType: attendanceData.serviceType,
        totalAttendance: parseInt(attendanceData.totalAttendance),
        adults: parseInt(attendanceData.adults) || 0,
        youth: parseInt(attendanceData.youth) || 0,
        children: parseInt(attendanceData.children) || 0,
        visitors: parseInt(attendanceData.visitors) || 0,
        notes: attendanceData.notes || '',
        members: attendanceData.members || []
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Attendance recorded successfully'
      };
    } catch (error) {
      console.error('Create attendance error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to record attendance',
        errors: error.response?.data?.errors
      };
    }
  },

  // Update attendance record
  updateAttendance: async (id, attendanceData) => {
    try {
      if (!id) {
        throw new Error('Attendance ID is required');
      }
      
      // Validate required fields
      if (!attendanceData.date) {
        throw new Error('Date is required');
      }
      if (!attendanceData.serviceType) {
        throw new Error('Service type is required');
      }
      if (attendanceData.totalAttendance === undefined || attendanceData.totalAttendance < 0) {
        throw new Error('Total attendance must be a non-negative number');
      }

      const response = await apiClient.put(`/attendance/${id}`, {
        date: attendanceData.date,
        serviceType: attendanceData.serviceType,
        totalAttendance: parseInt(attendanceData.totalAttendance),
        adults: parseInt(attendanceData.adults) || 0,
        youth: parseInt(attendanceData.youth) || 0,
        children: parseInt(attendanceData.children) || 0,
        visitors: parseInt(attendanceData.visitors) || 0,
        notes: attendanceData.notes || '',
        members: attendanceData.members || []
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Attendance updated successfully'
      };
    } catch (error) {
      console.error('Update attendance error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update attendance',
        errors: error.response?.data?.errors
      };
    }
  },

  // Delete attendance record
  deleteAttendance: async (id) => {
    try {
      if (!id) {
        throw new Error('Attendance ID is required');
      }
      
      const response = await apiClient.delete(`/attendance/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Attendance record deleted successfully'
      };
    } catch (error) {
      console.error('Delete attendance error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete attendance record'
      };
    }
  },

  // Get attendance statistics
  getAttendanceStats: async (period = 'month') => {
    try {
      const validPeriods = ['week', 'month', 'year'];
      if (!validPeriods.includes(period)) {
        throw new Error('Period must be one of: week, month, year');
      }
      
      const response = await apiClient.get(`/attendance/stats?period=${period}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Attendance statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Get attendance stats error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch attendance statistics',
        data: {
          totalRecords: 0,
          totalAttendance: 0,
          averageAttendance: 0,
          highestAttendance: 0,
          lowestAttendance: 0
        }
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
        message: response.data.message || 'Service types retrieved successfully'
      };
    } catch (error) {
      console.error('Get service types error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch service types',
        // Fallback data
        data: [
          'Sunday Fire Service',
          'Sunday School',
          'Sunday Main Service',
          'Tuesday Bible Study',
          'Wednesday Prayer',
          'Thursday Faith Clinic',
          'Friday Night Service',
          'Holy Ghost Service',
          'Special Program'
        ]
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
        message: response.data.message || 'Members retrieved successfully'
      };
    } catch (error) {
      console.error('Get members for attendance error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch members',
        data: []
      };
    }
  },

  // Generate attendance report
  generateReport: async (filters = {}) => {
    try {
      const reportData = {
        format: filters.format || 'csv',
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        serviceType: filters.serviceType || 'all'
      };

      if (reportData.format === 'csv') {
        // For CSV download
        const response = await apiClient.post('/attendance/report', reportData, {
          responseType: 'blob',
          headers: {
            'Accept': 'text/csv'
          }
        });

        // Create download link
        const filename = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return {
          success: true,
          data: { filename, type: 'download' },
          message: 'CSV report downloaded successfully'
        };
      } else {
        // For JSON response
        const response = await apiClient.post('/attendance/report', { ...reportData, format: 'json' });
        return {
          success: true,
          data: response.data.data,
          count: response.data.count,
          message: response.data.message || 'Report generated successfully'
        };
      }
    } catch (error) {
      console.error('Generate report error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate report'
      };
    }
  },

  // Bulk operations
  bulkCreateAttendance: async (attendanceRecords) => {
    try {
      if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
        throw new Error('Attendance records array is required');
      }

      const promises = attendanceRecords.map(record => 
        attendanceAPI.createAttendance(record)
      );
      
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
      const failed = results.filter(result => result.status === 'rejected' || !result.value.success);
      
      return {
        success: failed.length === 0,
        data: {
          successful: successful.length,
          failed: failed.length,
          total: attendanceRecords.length,
          results: results
        },
        message: `Bulk create completed: ${successful.length} successful, ${failed.length} failed`
      };
    } catch (error) {
      console.error('Bulk create attendance error:', error);
      return {
        success: false,
        message: error.message || 'Failed to bulk create attendance records'
      };
    }
  },

  // Search attendance records
  searchAttendance: async (searchTerm, filters = {}) => {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return await attendanceAPI.getAttendanceRecords(filters);
      }

      // Use the regular get method with additional search-like filters
      const searchFilters = {
        ...filters,
        serviceType: searchTerm.includes('service') ? searchTerm : filters.serviceType,
        // You can extend this based on your search requirements
      };

      return await attendanceAPI.getAttendanceRecords(searchFilters);
    } catch (error) {
      console.error('Search attendance error:', error);
      return {
        success: false,
        message: error.message || 'Failed to search attendance records',
        data: []
      };
    }
  },

  // Get attendance summary for dashboard
  getAttendanceSummary: async (period = 'month') => {
    try {
      const stats = await attendanceAPI.getAttendanceStats(period);
      
      if (!stats.success) {
        return stats;
      }

      // Get recent records for trend analysis
      const recentRecords = await attendanceAPI.getAttendanceRecords({
        limit: 10,
        sortBy: 'date',
        sortOrder: 'DESC'
      });

      return {
        success: true,
        data: {
          stats: stats.data,
          recentRecords: recentRecords.success ? recentRecords.data : [],
          period: period
        },
        message: 'Attendance summary retrieved successfully'
      };
    } catch (error) {
      console.error('Get attendance summary error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get attendance summary'
      };
    }
  }
};