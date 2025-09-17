// src/Services/eventsAPI.js 
import { apiClient } from './apiClient';

export const eventsAPI = {
  // Get all events with filtering and pagination
  getEvents: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination parameters
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      
      // Add filter parameters
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      if (filters.category && filters.category !== 'all') {
        queryParams.append('category', filters.category);
      }
      if (filters.upcoming) queryParams.append('upcoming', filters.upcoming);
      
      // Add sorting parameters
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      
      const response = await apiClient.get(`/events?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
        message: response.data.message || 'Events retrieved successfully'
      };
    } catch (error) {
      console.error('Get events error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch events',
        error: error.response?.data
      };
    }
  },

  // Get event by ID
  getEventById: async (id) => {
    try {
      if (!id) {
        throw new Error('Event ID is required');
      }
      
      const response = await apiClient.get(`/events/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Event details retrieved successfully'
      };
    } catch (error) {
      console.error('Get event by ID error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch event details',
        error: error.response?.data
      };
    }
  },

  // Create new event
  createEvent: async (eventData) => {
    try {
      // Validate required fields
      if (!eventData.title?.trim()) {
        throw new Error('Event title is required');
      }
      if (!eventData.description?.trim()) {
        throw new Error('Event description is required');
      }
      if (!eventData.date) {
        throw new Error('Event date is required');
      }
      if (!eventData.time) {
        throw new Error('Event time is required');
      }
      if (!eventData.location?.trim()) {
        throw new Error('Event location is required');
      }
      if (!eventData.category) {
        throw new Error('Event category is required');
      }

      const response = await apiClient.post('/events', {
        title: eventData.title.trim(),
        description: eventData.description.trim(),
        date: eventData.date,
        time: eventData.time,
        endTime: eventData.endTime || null,
        location: eventData.location.trim(),
        category: eventData.category,
        maxAttendees: eventData.maxAttendees ? parseInt(eventData.maxAttendees) : null,
        isRecurring: Boolean(eventData.isRecurring),
        recurringPattern: eventData.recurringPattern || null,
        registrationRequired: Boolean(eventData.registrationRequired),
        registrationDeadline: eventData.registrationDeadline || null,
        eventFee: eventData.eventFee ? parseFloat(eventData.eventFee) : 0,
        tags: Array.isArray(eventData.tags) ? eventData.tags : [],
        image: eventData.image || null
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Event created successfully'
      };
    } catch (error) {
      console.error('Create event error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create event',
        errors: error.response?.data?.errors
      };
    }
  },

  // Update event
  updateEvent: async (id, eventData) => {
    try {
      if (!id) {
        throw new Error('Event ID is required');
      }

      // Validate required fields if provided
      if (eventData.title !== undefined && !eventData.title?.trim()) {
        throw new Error('Event title cannot be empty');
      }
      if (eventData.description !== undefined && !eventData.description?.trim()) {
        throw new Error('Event description cannot be empty');
      }
      if (eventData.location !== undefined && !eventData.location?.trim()) {
        throw new Error('Event location cannot be empty');
      }

      const updateData = {
        ...(eventData.title !== undefined && { title: eventData.title.trim() }),
        ...(eventData.description !== undefined && { description: eventData.description.trim() }),
        ...(eventData.date !== undefined && { date: eventData.date }),
        ...(eventData.time !== undefined && { time: eventData.time }),
        ...(eventData.endTime !== undefined && { endTime: eventData.endTime }),
        ...(eventData.location !== undefined && { location: eventData.location.trim() }),
        ...(eventData.category !== undefined && { category: eventData.category }),
        ...(eventData.maxAttendees !== undefined && { 
          maxAttendees: eventData.maxAttendees ? parseInt(eventData.maxAttendees) : null 
        }),
        ...(eventData.isRecurring !== undefined && { isRecurring: Boolean(eventData.isRecurring) }),
        ...(eventData.recurringPattern !== undefined && { recurringPattern: eventData.recurringPattern }),
        ...(eventData.status !== undefined && { status: eventData.status }),
        ...(eventData.registrationRequired !== undefined && { 
          registrationRequired: Boolean(eventData.registrationRequired) 
        }),
        ...(eventData.registrationDeadline !== undefined && { 
          registrationDeadline: eventData.registrationDeadline 
        }),
        ...(eventData.eventFee !== undefined && { 
          eventFee: eventData.eventFee ? parseFloat(eventData.eventFee) : 0 
        }),
        ...(eventData.tags !== undefined && { 
          tags: Array.isArray(eventData.tags) ? eventData.tags : [] 
        }),
        ...(eventData.image !== undefined && { image: eventData.image })
      };

      const response = await apiClient.put(`/events/${id}`, updateData);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Event updated successfully'
      };
    } catch (error) {
      console.error('Update event error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update event',
        errors: error.response?.data?.errors
      };
    }
  },

  // Delete event
  deleteEvent: async (id) => {
    try {
      if (!id) {
        throw new Error('Event ID is required');
      }
      
      const response = await apiClient.delete(`/events/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Event deleted successfully'
      };
    } catch (error) {
      console.error('Delete event error:', error);
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
        message: response.data.message || 'Categories retrieved successfully'
      };
    } catch (error) {
      console.error('Get event categories error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch categories',
        // Fallback data
        data: [
          'Service',
          'Conference',
          'Seminar',
          'Workshop',
          'Outreach',
          'Fellowship',
          'Youth Event',
          'Children Event',
          'Prayer Meeting',
          'Special Program',
          'Other'
        ]
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
        message: response.data.message || 'Events statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Get events stats error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch events statistics',
        data: {
          totalEvents: 0,
          upcomingEvents: 0,
          completedEvents: 0,
          thisMonthEvents: 0,
          categoryStats: [],
          statusStats: []
        }
      };
    }
  },

  // Update event attendance
  updateEventAttendance: async (id, attendanceCount) => {
    try {
      if (!id) {
        throw new Error('Event ID is required');
      }
      if (attendanceCount < 0) {
        throw new Error('Attendance count cannot be negative');
      }

      const response = await apiClient.patch(`/events/${id}/attendance`, {
        attendanceCount: parseInt(attendanceCount)
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Event attendance updated successfully'
      };
    } catch (error) {
      console.error('Update event attendance error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update event attendance'
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
        message: response.data.message || 'Upcoming events retrieved successfully'
      };
    } catch (error) {
      console.error('Get upcoming events error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch upcoming events',
        data: []
      };
    }
  },

  // Export events
  exportEvents: async (filters = {}) => {
    try {
      const exportData = {
        format: filters.format || 'csv',
        status: filters.status || 'all',
        category: filters.category || 'all'
      };

      if (exportData.format === 'csv') {
        // For CSV download
        const response = await apiClient.get('/events/export', {
          params: exportData,
          responseType: 'blob',
          headers: {
            'Accept': 'text/csv'
          }
        });

        // Create download link
        const filename = `events_export_${new Date().toISOString().split('T')[0]}.csv`;
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
          message: 'CSV export downloaded successfully'
        };
      } else {
        // For JSON response
        const response = await apiClient.get('/events/export', {
          params: { ...exportData, format: 'json' }
        });
        
        return {
          success: true,
          data: response.data.data,
          count: response.data.count,
          message: response.data.message || 'Events exported successfully'
        };
      }
    } catch (error) {
      console.error('Export events error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to export events'
      };
    }
  },

  // Duplicate event
  duplicateEvent: async (id) => {
    try {
      if (!id) {
        throw new Error('Event ID is required');
      }

      const response = await apiClient.post(`/events/${id}/duplicate`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Event duplicated successfully'
      };
    } catch (error) {
      console.error('Duplicate event error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to duplicate event'
      };
    }
  },

  // Bulk operations
  bulkCreateEvents: async (eventsData) => {
    try {
      if (!Array.isArray(eventsData) || eventsData.length === 0) {
        throw new Error('Events data array is required');
      }

      const promises = eventsData.map(eventData => 
        eventsAPI.createEvent(eventData)
      );
      
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
      const failed = results.filter(result => result.status === 'rejected' || !result.value.success);
      
      return {
        success: failed.length === 0,
        data: {
          successful: successful.length,
          failed: failed.length,
          total: eventsData.length,
          results: results
        },
        message: `Bulk create completed: ${successful.length} successful, ${failed.length} failed`
      };
    } catch (error) {
      console.error('Bulk create events error:', error);
      return {
        success: false,
        message: error.message || 'Failed to bulk create events'
      };
    }
  },

  // Search events
  searchEvents: async (searchTerm, filters = {}) => {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return await eventsAPI.getEvents(filters);
      }

      const searchFilters = {
        ...filters,
        search: searchTerm.trim()
      };

      return await eventsAPI.getEvents(searchFilters);
    } catch (error) {
      console.error('Search events error:', error);
      return {
        success: false,
        message: error.message || 'Failed to search events',
        data: []
      };
    }
  },

  // Get events summary for dashboard
  getEventsSummary: async (filters = {}) => {
    try {
      const stats = await eventsAPI.getEventsStats();
      
      if (!stats.success) {
        return stats;
      }

      // Get recent events
      const recentEvents = await eventsAPI.getEvents({
        limit: 5,
        sortBy: 'date',
        sortOrder: 'DESC',
        ...filters
      });

      // Get upcoming events
      const upcomingEvents = await eventsAPI.getUpcomingEvents(5);

      return {
        success: true,
        data: {
          stats: stats.data,
          recentEvents: recentEvents.success ? recentEvents.data : [],
          upcomingEvents: upcomingEvents.success ? upcomingEvents.data : []
        },
        message: 'Events summary retrieved successfully'
      };
    } catch (error) {
      console.error('Get events summary error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get events summary'
      };
    }
  },

  // Get events by category
  getEventsByCategory: async (category) => {
    try {
      if (!category) {
        throw new Error('Category is required');
      }

      return await eventsAPI.getEvents({
        category: category,
        limit: 50,
        sortBy: 'date',
        sortOrder: 'ASC'
      });
    } catch (error) {
      console.error('Get events by category error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get events by category',
        data: []
      };
    }
  },

  // Get events by date range
  getEventsByDateRange: async (startDate, endDate) => {
    try {
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      return await eventsAPI.getEvents({
        // Note: Backend doesn't have direct date range filter in the current implementation
        // You might need to add this to the backend or filter on frontend
        limit: 100,
        sortBy: 'date',
        sortOrder: 'ASC'
      });
    } catch (error) {
      console.error('Get events by date range error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get events by date range',
        data: []
      };
    }
  },

  // Get today's events
  getTodaysEvents: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Filter events on the frontend since backend doesn't have a specific endpoint
      const allEvents = await eventsAPI.getEvents({
        limit: 50,
        sortBy: 'time',
        sortOrder: 'ASC'
      });

      if (!allEvents.success) {
        return allEvents;
      }

      const todaysEvents = allEvents.data.filter(event => event.date === today);

      return {
        success: true,
        data: todaysEvents,
        message: "Today's events retrieved successfully"
      };
    } catch (error) {
      console.error("Get today's events error:", error);
      return {
        success: false,
        message: "Failed to get today's events",
        data: []
      };
    }
  },

  // Validate event data
  validateEventData: (eventData) => {
    const errors = [];

    if (!eventData.title?.trim()) {
      errors.push('Event title is required');
    } else if (eventData.title.length < 3 || eventData.title.length > 200) {
      errors.push('Event title must be between 3 and 200 characters');
    }

    if (!eventData.description?.trim()) {
      errors.push('Event description is required');
    } else if (eventData.description.length < 10) {
      errors.push('Event description must be at least 10 characters');
    }

    if (!eventData.date) {
      errors.push('Event date is required');
    } else if (new Date(eventData.date) < new Date().setHours(0, 0, 0, 0)) {
      errors.push('Event date cannot be in the past');
    }

    if (!eventData.time) {
      errors.push('Event time is required');
    }

    if (!eventData.location?.trim()) {
      errors.push('Event location is required');
    }

    if (!eventData.category) {
      errors.push('Event category is required');
    }

    if (eventData.maxAttendees && (eventData.maxAttendees < 1 || eventData.maxAttendees > 50000)) {
      errors.push('Max attendees must be between 1 and 50,000');
    }

    if (eventData.time && eventData.endTime) {
      const startTime = new Date(`2000-01-01T${eventData.time}`);
      const endTime = new Date(`2000-01-01T${eventData.endTime}`);
      
      if (endTime <= startTime) {
        errors.push('End time must be after start time');
      }
    }

    if (eventData.isRecurring && !eventData.recurringPattern) {
      errors.push('Recurring pattern is required for recurring events');
    }

    if (eventData.eventFee && eventData.eventFee < 0) {
      errors.push('Event fee cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  // Format event for display
  formatEventForDisplay: (event) => {
    if (!event) return null;

    return {
      ...event,
      formattedDate: new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      formattedTime: event.time ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : '',
      formattedEndTime: event.endTime ? new Date(`2000-01-01T${event.endTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : '',
      formattedFee: event.eventFee ? new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(event.eventFee) : 'Free',
      daysUntil: Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24))
    };
  }
};