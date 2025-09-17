import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceAPI } from '@/Services/attendanceAPI';
import { toast } from 'react-toastify';

const AttendanceManagement = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
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
    startDate: '',
    endDate: '',
    serviceType: 'all',
    sortBy: 'date',
    sortOrder: 'DESC'
  });

  const [stats, setStats] = useState({
    totalRecords: 0,
    totalAttendance: 0,
    averageAttendance: 0,
    highestAttendance: 0,
    lowestAttendance: 0
  });

  useEffect(() => {
    fetchAttendanceRecords();
    fetchAttendanceStats();
  }, [filters]);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAttendanceRecords(filters);
      
      if (response.success) {
        setAttendanceRecords(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        toast.error(response.message);
        setAttendanceRecords([]);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await attendanceAPI.getAttendanceStats('month');
      
      if (response.success) {
        setStats({
          totalRecords: response.data.totalRecords || 0,
          totalAttendance: response.data.totalAttendance || 0,
          averageAttendance: Math.round(response.data.averageAttendance || 0),
          highestAttendance: response.data.highestAttendance || 0,
          lowestAttendance: response.data.lowestAttendance || 0
        });
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const handleViewDetails = async (recordId) => {
    try {
      const response = await attendanceAPI.getAttendanceById(recordId);
      
      if (response.success) {
        setSelectedRecord(response.data);
        setShowDetails(true);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      toast.error('Failed to load attendance details');
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      const response = await attendanceAPI.deleteAttendance(recordId);
      
      if (response.success) {
        setAttendanceRecords(prev => prev.filter(record => record.id !== recordId));
        toast.success('Attendance record deleted successfully');
        
        // Refresh the data to update pagination
        await fetchAttendanceRecords();
        await fetchAttendanceStats();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast.error('Failed to delete attendance record');
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
      startDate: '',
      endDate: '',
      serviceType: 'all',
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      handleFilterChange('page', newPage);
    }
  };

  const generateReport = async () => {
    try {
      const reportFilters = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        serviceType: filters.serviceType !== 'all' ? filters.serviceType : undefined,
        format: 'csv'
      };

      const response = await attendanceAPI.generateReport(reportFilters);
      
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  // Get unique service types from records
  const serviceTypes = [...new Set(attendanceRecords.map(record => record.serviceType))];

  if (loading && filters.page === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading attendance records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Track and manage church service attendance</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={generateReport}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <i className="ri-download-line mr-2"></i>
            Export CSV
          </button>
          <Link
            to="/attendance/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="ri-add-line mr-2"></i>
            Record Attendance
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-file-list-3-line text-blue-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="ri-group-line text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAttendance}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="ri-bar-chart-line text-yellow-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageAttendance}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="ri-arrow-up-line text-purple-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Highest</p>
              <p className="text-2xl font-bold text-gray-900">{stats.highestAttendance}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <i className="ri-arrow-down-line text-red-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Lowest</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowestAttendance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <select
              value={filters.serviceType}
              onChange={(e) => handleFilterChange('serviceType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Services</option>
              <option value="Sunday Fire Service">Sunday Fire Service</option>
              <option value="Sunday School">Sunday School</option>
              <option value="Sunday Main Service">Sunday Main Service</option>
              <option value="Tuesday Bible Study">Tuesday Bible Study</option>
              <option value="Wednesday Prayer">Wednesday Prayer</option>
              <option value="Thursday Faith Clinic">Thursday Faith Clinic</option>
              <option value="Friday Night Service">Friday Night Service</option>
              <option value="Holy Ghost Service">Holy Ghost Service</option>
              <option value="Special Program">Special Program</option>
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
              <option value="serviceType">Service Type</option>
              <option value="totalAttendance">Total Attendance</option>
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

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Attendance Records ({pagination.totalRecords})
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
                  Date & Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breakdown
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(record.date)}
                      </div>
                      <div className="text-sm text-gray-500">{record.serviceType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-blue-600">
                      {record.totalAttendance}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Adults: {record.adults || 0}</div>
                      <div>Youth: {record.youth || 0}</div>
                      <div>Children: {record.children || 0}</div>
                      <div>Visitors: {record.visitors || 0}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.recordedBy}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(record.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <i className="ri-eye-line text-lg"></i>
                      </button>
                      <Link
                        to={`/attendance/${record.id}/edit`}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit Record"
                      >
                        <i className="ri-edit-line text-lg"></i>
                      </Link>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Record"
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
        {!loading && attendanceRecords.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-calendar-check-line text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
            <p className="text-gray-500 mb-4">
              {filters.startDate || filters.endDate || filters.serviceType !== 'all'
                ? "No records match your current filters. Try adjusting your search criteria."
                : "Start by recording your first attendance."
              }
            </p>
            {!filters.startDate && !filters.endDate && filters.serviceType === 'all' && (
              <Link
                to="/attendance/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="ri-add-line mr-2"></i>
                Record First Attendance
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Attendance Details Modal */}
      {showDetails && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Attendance Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Information */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">Service Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Date:</span>
                        <span className="text-sm font-medium text-blue-900">{formatDate(selectedRecord.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Service Type:</span>
                        <span className="text-sm font-medium text-blue-900">{selectedRecord.serviceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Recorded By:</span>
                        <span className="text-sm font-medium text-blue-900">{selectedRecord.recordedBy}</span>
                      </div>
                      {selectedRecord.notes && (
                        <div className="mt-3">
                          <span className="text-sm text-blue-700">Notes:</span>
                          <p className="text-sm text-blue-900 mt-1">{selectedRecord.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-900 mb-2">Attendance Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedRecord.totalAttendance}</div>
                        <div className="text-sm text-green-700">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{selectedRecord.adults || 0}</div>
                        <div className="text-sm text-green-700">Adults</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{selectedRecord.youth || 0}</div>
                        <div className="text-sm text-green-700">Youth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{selectedRecord.children || 0}</div>
                        <div className="text-sm text-green-700">Children</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">{selectedRecord.visitors || 0}</div>
                        <div className="text-sm text-orange-700">Visitors</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Member Attendance List */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Member Attendance</h4>
                    {selectedRecord.members && selectedRecord.members.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {selectedRecord.members.map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${
                                member.present ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">{member.name}</span>
                                {member.department && (
                                  <div className="text-xs text-gray-500">{member.department}</div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.present && member.timeArrived ? (
                                <span>Arrived: {formatTime(member.timeArrived)}</span>
                              ) : member.present ? (
                                <span className="text-green-600">Present</span>
                              ) : (
                                <span className="text-red-600">Absent</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No member attendance data available</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                <Link
                  to={`/attendance/${selectedRecord.id}/edit`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setShowDetails(false)}
                >
                  Edit Record
                </Link>
                <button
                  onClick={() => setShowDetails(false)}
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

export default AttendanceManagement;