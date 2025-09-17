import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '@/Services/eventsAPI';
import { toast } from 'react-toastify';

const EventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    category: 'all',
    sortBy: 'date',
    sortOrder: 'ASC'
  });

  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    thisMonthEvents: 0
  });

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEvents(filters);
      
      if (response.success) {
        setEvents(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        toast.error(response.message);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await eventsAPI.getEventsStats();
      
      if (response.success) {
        setStats({
          totalEvents: response.data.totalEvents || 0,
          upcomingEvents: response.data.upcomingEvents || 0,
          completedEvents: response.data.completedEvents || 0,
          thisMonthEvents: response.data.thisMonthEvents || 0
        });
      }
    } catch (error) {
      console.error('Error fetching events stats:', error);
    }
  };

  const handleEventClick = async (eventId) => {
    try {
      const response = await eventsAPI.getEventById(eventId);
      
      if (response.success) {
        setSelectedEvent(response.data);
        setShowEventDetails(true);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Failed to load event details');
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      const response = await eventsAPI.updateEvent(eventId, { status: newStatus });
      
      if (response.success) {
        setEvents(prev => 
          prev.map(event => 
            event.id === eventId ? { ...event, status: newStatus } : event
          )
        );
        toast.success(`Event status updated to ${newStatus}`);
        fetchStats(); // Refresh stats
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Failed to update event status');
    }
  };

  const handleDelete = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await eventsAPI.deleteEvent(eventId);
      
      if (response.success) {
        setEvents(prev => prev.filter(event => event.id !== eventId));
        toast.success('Event deleted successfully');
        
        // Refresh data to update pagination
        await fetchEvents();
        await fetchStats();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleDuplicate = async (eventId) => {
    try {
      const response = await eventsAPI.duplicateEvent(eventId);
      
      if (response.success) {
        fetchEvents(); // Refresh the list
        toast.success('Event duplicated successfully');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error duplicating event:', error);
      toast.error('Failed to duplicate event');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset to page 1 when filters change
    }));
  };

  const handleClearFilters = () => {
    setFilters(prev => ({
      ...prev,
      search: '',
      status: 'all',
      category: 'all',
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      handleFilterChange('page', newPage);
    }
  };

  const handleExport = async () => {
    try {
      const exportFilters = {
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        format: 'csv'
      };

      const response = await eventsAPI.exportEvents(exportFilters);
      
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error exporting events:', error);
      toast.error('Failed to export events');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique categories from events for filter
  const categories = [...new Set(events.map(event => event.category))].filter(Boolean);

  if (loading && filters.page === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600 mt-1">Manage church events and activities</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <i className="ri-download-line mr-2"></i>
            Export CSV
          </button>
          <Link
            to="/events/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="ri-add-line mr-2"></i>
            Create Event
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-calendar-event-line text-blue-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalEvents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="ri-calendar-check-line text-green-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-lg font-semibold text-gray-900">{stats.upcomingEvents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="ri-calendar-todo-line text-purple-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-lg font-semibold text-gray-900">{stats.completedEvents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="ri-calendar-line text-yellow-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-lg font-semibold text-gray-900">{stats.thisMonthEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title, description, or location..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="Service">Service</option>
              <option value="Conference">Conference</option>
              <option value="Seminar">Seminar</option>
              <option value="Workshop">Workshop</option>
              <option value="Outreach">Outreach</option>
              <option value="Fellowship">Fellowship</option>
              <option value="Youth Event">Youth Event</option>
              <option value="Children Event">Children Event</option>
              <option value="Prayer Meeting">Prayer Meeting</option>
              <option value="Special Program">Special Program</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="category">Category</option>
              <option value="status">Status</option>
              <option value="createdAt">Created Date</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Events ({pagination.totalRecords})
          </h2>
          <div className="flex items-center space-x-2">
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {event.image ? (
                          <img 
                            src={event.image} 
                            alt={event.title} 
                            className="h-12 w-12 rounded-lg object-cover" 
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <i className="ri-calendar-event-line text-gray-500"></i>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-500">{event.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(event.date)}</div>
                    <div className="text-sm text-gray-500">
                      {formatTime(event.time)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 truncate max-w-xs">{event.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {event.currentAttendees || 0}
                      {event.maxAttendees && ` / ${event.maxAttendees}`}
                    </div>
                    {event.maxAttendees && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{
                            width: `${Math.min(100, ((event.currentAttendees || 0) / event.maxAttendees) * 100)}%`
                          }}
                        ></div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEventClick(event.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <i className="ri-eye-line text-lg"></i>
                      </button>
                      <Link
                        to={`/events/${event.id}/edit`}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit Event"
                      >
                        <i className="ri-edit-line text-lg"></i>
                      </Link>
                      <button
                        onClick={() => handleDuplicate(event.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Duplicate Event"
                      >
                        <i className="ri-file-copy-line text-lg"></i>
                      </button>
                      <div className="relative group">
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Change Status"
                        >
                          <i className="ri-more-line text-lg"></i>
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                          <div className="py-1">
                            {['upcoming', 'ongoing', 'completed', 'cancelled'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(event.id, status)}
                                disabled={event.status === status}
                                className={`block px-4 py-2 text-sm w-full text-left capitalize transition-colors ${
                                  event.status === status 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                Mark as {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Event"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading State for pagination */}
        {loading && filters.page > 1 && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of{' '}
                {pagination.totalRecords} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else {
                      const start = Math.max(1, pagination.currentPage - 2);
                      const end = Math.min(pagination.totalPages, start + 4);
                      pageNum = start + i;
                      if (pageNum > end) return null;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-calendar-event-line text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.status !== 'all' || filters.category !== 'all'
                ? "No events match your current filters. Try adjusting your search criteria."
                : "Start by creating your first event."
              }
            </p>
            {!filters.search && filters.status === 'all' && filters.category === 'all' && (
              <Link
                to="/events/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="ri-add-line mr-2"></i>
                Create First Event
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Event Information */}
                <div className="space-y-4">
                  {selectedEvent.image && (
                    <div>
                      <img 
                        src={selectedEvent.image} 
                        alt={selectedEvent.title} 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedEvent.title}</h4>
                    <p className="text-gray-600 mb-4">{selectedEvent.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Date:</span>
                        <p className="text-gray-900">{formatDate(selectedEvent.date)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Time:</span>
                        <p className="text-gray-900">
                          {formatTime(selectedEvent.time)}
                          {selectedEvent.endTime && ` - ${formatTime(selectedEvent.endTime)}`}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <p className="text-gray-900">{selectedEvent.location}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <p className="text-gray-900">{selectedEvent.category}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Organizer:</span>
                        <p className="text-gray-900">{selectedEvent.organizer}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedEvent.status)}`}>
                          {selectedEvent.status}
                        </span>
                      </div>
                      {selectedEvent.eventFee > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Fee:</span>
                          <p className="text-gray-900">
                            {new Intl.NumberFormat('en-NG', {
                              style: 'currency',
                              currency: 'NGN'
                            }).format(selectedEvent.eventFee)}
                          </p>
                        </div>
                      )}
                      {selectedEvent.registrationRequired && (
                        <div>
                          <span className="font-medium text-gray-700">Registration:</span>
                          <p className="text-gray-900">Required</p>
                          {selectedEvent.registrationDeadline && (
                            <p className="text-xs text-gray-500">
                              Deadline: {formatDate(selectedEvent.registrationDeadline)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                      <div className="mt-4">
                        <span className="font-medium text-gray-700 text-sm">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedEvent.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attendance Information */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Attendance Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedEvent.currentAttendees || 0}</div>
                        <div className="text-sm text-gray-600">Current</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedEvent.maxAttendees || '∞'}
                        </div>
                        <div className="text-sm text-gray-600">Maximum</div>
                      </div>
                    </div>
                    
                    {selectedEvent.maxAttendees && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Capacity Used</span>
                          <span>{Math.round(((selectedEvent.currentAttendees || 0) / selectedEvent.maxAttendees) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{
                              width: `${Math.min(100, ((selectedEvent.currentAttendees || 0) / selectedEvent.maxAttendees) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedEvent.isRecurring && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">
                        <i className="ri-repeat-line mr-2"></i>
                        Recurring Event
                      </h4>
                      <p className="text-purple-700 text-sm">
                        This event repeats {selectedEvent.recurringPattern}
                      </p>
                    </div>
                  )}

                  {selectedEvent.registrationRequired && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">
                        <i className="ri-user-add-line mr-2"></i>
                        Registration Required
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        Participants must register to attend this event
                      </p>
                      {selectedEvent.registrationDeadline && (
                        <p className="text-yellow-600 text-xs mt-1">
                          Registration closes: {formatDate(selectedEvent.registrationDeadline)}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedEvent.eventFee === 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">
                        <i className="ri-money-dollar-circle-line mr-2"></i>
                        Free Event
                      </h4>
                      <p className="text-green-700 text-sm">
                        This is a free event - no payment required
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      <i className="ri-information-line mr-2"></i>
                      Event Information
                    </h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>Created: {formatDate(selectedEvent.createdAt)}</p>
                      <p>Last Updated: {formatDate(selectedEvent.updatedAt)}</p>
                      {selectedEvent.isRecurring && (
                        <p className="font-medium">Recurring: {selectedEvent.recurringPattern}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                <button
                  onClick={() => handleDuplicate(selectedEvent.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <i className="ri-file-copy-line mr-2"></i>
                  Duplicate
                </button>
                <Link
                  to={`/events/${selectedEvent.id}/edit`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setShowEventDetails(false)}
                >
                  <i className="ri-edit-line mr-2"></i>
                  Edit Event
                </Link>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsManagement;