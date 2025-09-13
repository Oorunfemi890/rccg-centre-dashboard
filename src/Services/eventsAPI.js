// src/Services/eventsAPI.js - Production Ready
import { apiClient } from './apiClient';

export const eventsAPI = {
  // Get all events
  getEvents: async (filters = {}) => {
    try {
      const response = await apiClient.get('/events', { params: filters });
      return {
        success: true,
        data: response.data.data,
        message: 'Events retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch events'
      };
    }
  },

  // Get event by ID
  getEventById: async (id) => {
    try {
      const response = await apiClient.get(`/events/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Event details retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch event details'
      };
    }
  },

  // Create new event
  createEvent: async (eventData) => {
    try {
      const response = await apiClient.post('/events', eventData);
      return {
        success: true,
        data: response.data.data,
        message: 'Event created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create event'
      };
    }
  },

  // Update event
  updateEvent: async (id, eventData) => {
    try {
      const response = await apiClient.put(`/events/${id}`, eventData);
      return {
        success: true,
        data: response.data.data,
        message: 'Event updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update event'
      };
    }
  },

  // Delete event
  deleteEvent: async (id) => {
    try {
      await apiClient.delete(`/events/${id}`);
      return {
        success: true,
        message: 'Event deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete event'
      };
    }
  },

  // Get event categories
  getEventCategories: async () => {
    try {
      const response = await apiClient.get('/events/categories');
      return {
        success: true,
        data: response.data.data,
        message: 'Categories retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch categories'
      };
    }
  },

  // Get events statistics
  getEventsStats: async () => {
    try {
      const response = await apiClient.get('/events/stats');
      return {
        success: true,
        data: response.data.data,
        message: 'Events statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch events statistics'
      };
    }
  },

  // Update event attendance
  updateEventAttendance: async (id, attendanceCount) => {
    try {
      const response = await apiClient.patch(`/events/${id}/attendance`, {
        attendanceCount: attendanceCount
      });
      return {
        success: true,
        data: response.data.data,
        message: 'Event attendance updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update event attendance'
      };
    }
  },

  // Get upcoming events for calendar
  getUpcomingEvents: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/events/upcoming?limit=${limit}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Upcoming events retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch upcoming events'
      };
    }
  },

  // Export events
  exportEvents: async (format = 'csv', filters = {}) => {
    try {
      const response = await apiClient.get('/events/export', {
        params: { format, ...filters },
        responseType: 'blob'
      });

      const filename = `events_export_${new Date().toISOString().split('T')[0]}.${format}`;
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
        message: 'Events exported successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to export events'
      };
    }
  },

  // Duplicate event
  duplicateEvent: async (id) => {
    try {
      const response = await apiClient.post(`/events/${id}/duplicate`);
      return {
        success: true,
        data: response.data.data,
        message: 'Event duplicated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to duplicate event'
      };
    }
  }
};