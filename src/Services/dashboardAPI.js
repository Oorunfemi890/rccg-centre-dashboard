// src/Services/dashboardAPI.js - Production Ready with Backend Integration
import { apiClient } from './apiClient';

export const dashboardAPI = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      const response = await apiClient.get('/dashboard/stats');
      
      if (response.data) {
        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message || 'Stats retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: 'No data received from server'
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch stats',
        error: error
      };
    }
  },

  // Get recent activities
  getRecentActivities: async () => {
    try {
      const response = await apiClient.get('/dashboard/recent-activities');
      
      if (response.data) {
        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message || 'Recent activities retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: 'No data received from server'
      };
    } catch (error) {
      console.error('Dashboard recent activities error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch recent activities',
        error: error
      };
    }
  },

  // Get upcoming events
  getUpcomingEvents: async (limit = 5) => {
    try {
      const response = await apiClient.get(`/dashboard/upcoming-events?limit=${limit}`);
      
      if (response.data) {
        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message || 'Upcoming events retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: 'No data received from server'
      };
    } catch (error) {
      console.error('Dashboard upcoming events error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch upcoming events',
        error: error
      };
    }
  },

  // Get attendance summary
  getAttendanceSummary: async (period = 'week') => {
    try {
      const response = await apiClient.get(`/dashboard/attendance-summary?period=${period}`);
      
      if (response.data) {
        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message || 'Attendance summary retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: 'No data received from server'
      };
    } catch (error) {
      console.error('Dashboard attendance summary error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch attendance summary',
        error: error
      };
    }
  },

  // Get member growth data
  getMemberGrowth: async (period = 'year') => {
    try {
      const response = await apiClient.get(`/dashboard/member-growth?period=${period}`);
      
      if (response.data) {
        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message || 'Member growth data retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: 'No data received from server'
      };
    } catch (error) {
      console.error('Dashboard member growth error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch member growth data',
        error: error
      };
    }
  },

  // Get all dashboard data at once (optimized for dashboard loading)
  getAllDashboardData: async () => {
    try {
      const [statsResponse, activitiesResponse, eventsResponse] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(), 
        dashboardAPI.getUpcomingEvents(5)
      ]);

      return {
        success: true,
        data: {
          stats: statsResponse.status === 'fulfilled' && statsResponse.value.success ? 
                 statsResponse.value.data : null,
          activities: activitiesResponse.status === 'fulfilled' && activitiesResponse.value.success ? 
                      activitiesResponse.value.data : [],
          events: eventsResponse.status === 'fulfilled' && eventsResponse.value.success ? 
                  eventsResponse.value.data : []
        },
        errors: {
          stats: statsResponse.status === 'rejected' || !statsResponse.value?.success ? 
                 (statsResponse.value?.message || 'Failed to load stats') : null,
          activities: activitiesResponse.status === 'rejected' || !activitiesResponse.value?.success ? 
                      (activitiesResponse.value?.message || 'Failed to load activities') : null,
          events: eventsResponse.status === 'rejected' || !eventsResponse.value?.success ? 
                  (eventsResponse.value?.message || 'Failed to load events') : null
        }
      };
    } catch (error) {
      console.error('Dashboard all data error:', error);
      
      return {
        success: false,
        message: 'Failed to load dashboard data',
        error: error
      };
    }
  },

  // Get quick stats for header/summary
  getQuickStats: async () => {
    try {
      const response = await apiClient.get('/dashboard/quick-stats');
      
      if (response.data) {
        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message || 'Quick stats retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: 'No data received from server'
      };
    } catch (error) {
      console.error('Dashboard quick stats error:', error);
      
      // Return default stats if endpoint doesn't exist
      if (error.response?.status === 404) {
        return {
          success: true,
          data: {
            totalMembers: 0,
            activeMembers: 0,
            upcomingEvents: 0,
            pendingCelebrations: 0
          },
          message: 'Using default stats'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch quick stats',
        error: error
      };
    }
  },

  // Get chart data for dashboard visualizations
  getChartData: async (chartType = 'attendance', period = 'month') => {
    try {
      const response = await apiClient.get(`/dashboard/chart-data?type=${chartType}&period=${period}`);
      
      if (response.data) {
        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message || 'Chart data retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: 'No data received from server'
      };
    } catch (error) {
      console.error('Dashboard chart data error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch chart data',
        error: error
      };
    }
  }
};