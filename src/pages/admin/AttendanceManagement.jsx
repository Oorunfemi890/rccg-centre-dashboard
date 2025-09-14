import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceAPI } from '@/Services/attendanceAPI';
import { toast } from 'react-toastify';

const AttendanceManagement = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [stats, setStats] = useState({
    totalRecords: 0,
    averageAttendance: 0,
    highestAttendance: 0,
    lowestAttendance: 0
  });

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [attendanceRecords]);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAttendanceRecords();
      
      if (response.success) {
        setAttendanceRecords(response.data);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (attendanceRecords.length === 0) return;

    const totalAttendances = attendanceRecords.map(record => record.totalAttendance);
    const total = totalAttendances.reduce((sum, attendance) => sum + attendance, 0);

    setStats({
      totalRecords: attendanceRecords.length,
      averageAttendance: Math.round(total / attendanceRecords.length),
      highestAttendance: Math.max(...totalAttendances),
      lowestAttendance: Math.min(...totalAttendances)
    });
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
    if (!confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      const response = await attendanceAPI.deleteAttendance(recordId);
      
      if (response.success) {
        setAttendanceRecords(prev => prev.filter(record => record.id !== recordId));
        toast.success('Attendance record deleted successfully');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast.error('Failed to delete attendance record');
    }
  };

  const filterRecords = () => {
    return attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      const matchesDateRange = (!dateRange.startDate || recordDate >= new Date(dateRange.startDate)) &&
                              (!dateRange.endDate || recordDate <= new Date(dateRange.endDate));
      const matchesServiceType = serviceTypeFilter === 'all' || record.serviceType === serviceTypeFilter;
      
      return matchesDateRange && matchesServiceType;
    });
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

  const serviceTypes = [...new Set(attendanceRecords.map(record => record.serviceType))];
  const filteredRecords = filterRecords();

  if (loading) {
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
        <Link
          to="/attendance/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Record Attendance
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-sm text-gray-600">Average Attendance</p>
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="ri-arrow-down-line text-yellow-600 text-xl"></i>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Services</option>
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateRange({ startDate: '', endDate: '' });
                setServiceTypeFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Attendance Records ({filteredRecords.length})
          </h2>
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
              {filteredRecords.map((record) => (
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
                      <div>Adults: {record.adults}</div>
                      <div>Youth: {record.youth}</div>
                      <div>Children: {record.children}</div>
                      <div>Visitors: {record.visitors}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.recordedBy}</div>
                    <div className="text-xs text-gray-500">
                      {formatTime(record.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(record.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      <Link
                        to={`/attendance/${record.id}/edit`}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit Record"
                      >
                        <i className="ri-edit-line"></i>
                      </Link>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Record"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-calendar-check-line text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
            <p className="text-gray-500 mb-4">
              {attendanceRecords.length === 0 
                ? "Start by recording your first attendance." 
                : "Try adjusting your filters or date range."
              }
            </p>
            {attendanceRecords.length === 0 && (
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
                        <div className="text-xl font-bold text-green-600">{selectedRecord.adults}</div>
                        <div className="text-sm text-green-700">Adults</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{selectedRecord.youth}</div>
                        <div className="text-sm text-green-700">Youth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{selectedRecord.children}</div>
                        <div className="text-sm text-green-700">Children</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">{selectedRecord.visitors}</div>
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
                              <span className="text-sm font-medium text-gray-900">{member.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.present && member.timeArrived ? (
                                <span>Arrived: {formatTime(member.timeArrived)}</span>
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