import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardAPI } from '@/Services/dashboardAPI';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { admin } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    upcomingEvents: 0,
    pendingCelebrations: 0,
    thisWeekAttendance: 0,
    thisMonthAttendance: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, activitiesResponse, eventsResponse] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(),
        dashboardAPI.getUpcomingEvents(5)
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (activitiesResponse.success) {
        setRecentActivities(activitiesResponse.data);
      }

      if (eventsResponse.success) {
        setUpcomingEvents(eventsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {admin?.name?.split(' ')[0]}!
            </h1>
            <p className="text-blue-100 mt-1">
              Here's what's happening with your church today
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="text-right">
              <p className="text-blue-100 text-sm">Today</p>
              <p className="text-xl font-semibold">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Members */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-group-line text-blue-600 text-2xl"></i>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
            <div className="text-right">
              <span className="text-green-600 text-sm font-medium">
                +{stats.activeMembers} active
              </span>
            </div>
          </div>
        </div>

        {/* This Week Attendance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="ri-calendar-check-line text-green-600 text-2xl"></i>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeekAttendance}</p>
            </div>
            <Link 
              to="/attendance" 
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="ri-calendar-event-line text-purple-600 text-2xl"></i>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
            </div>
            <Link 
              to="/events" 
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Manage
            </Link>
          </div>
        </div>

        {/* Pending Celebrations */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="ri-cake-3-line text-yellow-600 text-2xl"></i>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Pending Celebrations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingCelebrations}</p>
            </div>
            <Link 
              to="/celebrations" 
              className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
            >
              Review
            </Link>
          </div>
        </div>

        {/* Monthly Attendance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <i className="ri-bar-chart-line text-red-600 text-2xl"></i>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonthAttendance}</p>
            </div>
            <span className="text-red-600 text-sm font-medium">Average</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <div className="p-2 bg-gray-100 rounded-lg mx-auto w-fit mb-3">
              <i className="ri-add-line text-gray-600 text-2xl"></i>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-3">Quick Actions</p>
            <div className="space-y-2">
              <Link 
                to="/attendance/new" 
                className="block w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Record Attendance
              </Link>
              <Link 
                to="/events/new" 
                className="block w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
              >
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <i className="ri-history-line mr-2 text-gray-500"></i>
              Recent Activities
            </h2>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${activity.iconBg}`}>
                      <i className={`${activity.icon} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activities</p>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <i className="ri-calendar-event-line mr-2 text-gray-500"></i>
              Upcoming Events
            </h2>
            <Link 
              to="/events" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(event.date)} at {formatTime(event.time)}
                        </p>
                        <p className="text-xs text-gray-500">
                          <i className="ri-map-pin-line mr-1"></i>
                          {event.location}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                        event.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to="/members" 
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <i className="ri-group-line text-blue-600 text-xl mr-3"></i>
            <span className="text-sm font-medium text-blue-900">Members</span>
          </Link>
          <Link 
            to="/attendance" 
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <i className="ri-calendar-check-line text-green-600 text-xl mr-3"></i>
            <span className="text-sm font-medium text-green-900">Attendance</span>
          </Link>
          <Link 
            to="/events" 
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <i className="ri-calendar-event-line text-purple-600 text-xl mr-3"></i>
            <span className="text-sm font-medium text-purple-900">Events</span>
          </Link>
          <Link 
            to="/celebrations" 
            className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <i className="ri-cake-3-line text-yellow-600 text-xl mr-3"></i>
            <span className="text-sm font-medium text-yellow-900">Celebrations</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;