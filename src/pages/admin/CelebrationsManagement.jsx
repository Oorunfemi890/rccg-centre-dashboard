import React, { useState, useEffect } from 'react';
import { celebrationsAPI } from '@/Services/celebrationsAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket, useRealtimeData } from '@/contexts/WebSocketContext';
import { toast } from 'react-toastify';

const CelebrationsManagement = () => {
  const { admin } = useAuth();
  const { isConnected } = useWebSocket();
  const lastUpdate = useRealtimeData('celebrations');
  
  const [celebrations, setCelebrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all'); // New filter for member vs public
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCelebration, setSelectedCelebration] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({});
  const [selectedCelebrations, setSelectedCelebrations] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const celebrationsPerPage = 12;

  // Reload data when realtime update occurs
  useEffect(() => {
    if (lastUpdate) {
      fetchCelebrations();
    }
  }, [lastUpdate]);

  useEffect(() => {
    fetchCelebrations();
    fetchStats();
  }, []);

  const fetchCelebrations = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        limit: celebrationsPerPage,
        status: filterStatus,
        type: filterType,
        memberType: filterSource,
        search: searchTerm
      };
      
      const response = await celebrationsAPI.getCelebrations(filters);
      
      if (response.success) {
        setCelebrations(response.data || []);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error fetching celebrations:', error);
      toast.error('Failed to load celebrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await celebrationsAPI.getCelebrationsStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchCelebrations();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus, filterType, filterSource]);

  const handleViewDetails = async (celebrationId) => {
    try {
      const response = await celebrationsAPI.getCelebrationById(celebrationId);
      
      if (response.success) {
        setSelectedCelebration(response.data);
        setShowDetails(true);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error fetching celebration details:', error);
      toast.error('Failed to load celebration details');
    }
  };

  const handleStatusChange = async (celebrationId, newStatus, rejectionReason = null) => {
    try {
      const updateData = { 
        status: newStatus,
        rejectionReason: newStatus === 'rejected' ? rejectionReason : null
      };

      const response = await celebrationsAPI.updateCelebrationStatus(celebrationId, updateData);
      
      if (response.success) {
        setCelebrations(prev => 
          prev.map(celebration => 
            celebration.id === celebrationId 
              ? { ...celebration, status: newStatus, ...updateData }
              : celebration
          )
        );
        
        toast.success(`Celebration ${newStatus} successfully`);
        fetchStats(); // Refresh stats
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error deleting celebration:', error);
      toast.error('Failed to delete celebration');
    }
  };

  const handleSelectCelebration = (celebrationId) => {
    setSelectedCelebrations(prev => {
      if (prev.includes(celebrationId)) {
        return prev.filter(id => id !== celebrationId);
      } else {
        return [...prev, celebrationId];
      }
    });
  };

  const handleSelectAll = () => {
    const pendingCelebrations = celebrations
      .filter(c => c.status === 'pending')
      .map(c => c.id);
    
    if (selectedCelebrations.length === pendingCelebrations.length) {
      setSelectedCelebrations([]);
    } else {
      setSelectedCelebrations(pendingCelebrations);
    }
  };

  // Filter and search logic
  const filteredCelebrations = celebrations.filter(celebration => {
    const matchesSearch = celebration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         celebration.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (celebration.phone && celebration.phone.includes(searchTerm)) ||
                         (celebration.email && celebration.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || celebration.status === filterStatus;
    const matchesType = filterType === 'all' || celebration.type === filterType;
    const matchesSource = filterSource === 'all' || 
                         (filterSource === 'member' && celebration.isFromMember) ||
                         (filterSource === 'public' && !celebration.isFromMember);
    
    return matchesSearch && matchesStatus && matchesType && matchesSource;
  });

  // Get unique types for filter
  const types = [...new Set(celebrations.map(celebration => celebration.type))].filter(Boolean);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'ri-time-line';
      case 'approved':
        return 'ri-check-line';
      case 'rejected':
        return 'ri-close-line';
      default:
        return 'ri-question-line';
    }
  };

  const getSourceBadge = (celebration) => {
    if (celebration.isFromMember) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          <i className="ri-user-line mr-1"></i>
          Member
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          <i className="ri-global-line mr-1"></i>
          Public
        </span>
      );
    }
  };

  const pendingCount = stats.pendingCelebrations || 0;
  const approvedCount = stats.approvedCelebrations || 0;
  const rejectedCount = stats.rejectedCelebrations || 0;
  const totalCount = stats.totalCelebrations || 0;
  const memberCount = stats.memberCelebrations || 0;
  const publicCount = stats.publicCelebrations || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading celebrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Celebrations Management</h1>
          <p className="text-gray-600 mt-1">
            Review and manage member & public celebration requests
            {isConnected && (
              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                <i className="ri-wifi-line mr-1"></i>
                Live Updates
              </span>
            )}
          </p>
        </div>
        
        {/* Export Button */}
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => celebrationsAPI.exportCelebrations('csv')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <i className="ri-download-line mr-2"></i>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-cake-3-line text-blue-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-semibold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="ri-time-line text-yellow-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-lg font-semibold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="ri-check-line text-green-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-lg font-semibold text-gray-900">{approvedCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <i className="ri-close-line text-red-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-lg font-semibold text-gray-900">{rejectedCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="ri-user-line text-purple-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-lg font-semibold text-gray-900">{memberCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <i className="ri-global-line text-gray-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Public</p>
              <p className="text-lg font-semibold text-gray-900">{publicCount}</p>
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
                placeholder="Search by name, type, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="member">Members</option>
              <option value="public">Public</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterType('all');
                setFilterSource('all');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCelebrations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="ri-checkbox-multiple-line text-blue-600 mr-2"></i>
              <span className="text-blue-800 font-medium">
                {selectedCelebrations.length} celebration(s) selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkApprove}
                disabled={bulkLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {bulkLoading ? (
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                ) : (
                  <i className="ri-check-line mr-2"></i>
                )}
                Bulk Approve
              </button>
              <button
                onClick={() => setSelectedCelebrations([])}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebrations Grid */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Celebration Requests ({filteredCelebrations.length})
          </h2>
          
          {pendingCount > 0 && (
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <i className="ri-checkbox-multiple-line mr-1"></i>
                {selectedCelebrations.length === celebrations.filter(c => c.status === 'pending').length 
                  ? 'Deselect All' 
                  : 'Select All Pending'
                }
              </button>
            </div>
          )}
        </div>
        
        {filteredCelebrations.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-cake-3-line text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No celebration requests found</h3>
            <p className="text-gray-500">
              {celebrations.length === 0 
                ? "No celebration requests have been submitted yet." 
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredCelebrations.map((celebration) => (
              <div 
                key={celebration.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {celebration.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedCelebrations.includes(celebration.id)}
                        onChange={() => handleSelectCelebration(celebration.id)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <i className="ri-cake-3-line text-purple-600"></i>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {getSourceBadge(celebration)}
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(celebration.status)}`}>
                      <i className={`${getStatusIcon(celebration.status)} mr-1`}></i>
                      {celebration.status}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{celebration.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{celebration.type}</p>
                  <p className="text-sm text-gray-500">
                    📅 {celebration.month}/{celebration.date}
                    {celebration.year && ` (${celebration.year})`}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      📞 {celebration.phone}
                    </p>
                    {celebration.email && (
                      <p className="text-sm text-gray-600">
                        ✉️ {celebration.email}
                      </p>
                    )}
                  </div>
                </div>

                {celebration.pictures && celebration.pictures.length > 0 && (
                  <div className="mb-3">
                    <div className="flex space-x-2">
                      {celebration.pictures.slice(0, 3).map((picture, index) => (
                        <img 
                          key={index}
                          src={picture} 
                          alt={`Celebration ${index + 1}`} 
                          className="w-16 h-16 object-cover rounded border border-gray-200"
                        />
                      ))}
                      {celebration.pictures.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-500 text-xs">
                          +{celebration.pictures.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    {formatDate(celebration.createdAt)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(celebration.id)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="View Details"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                    {celebration.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(celebration.id, 'approved')}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Approve"
                        >
                          <i className="ri-check-line"></i>
                        </button>
                        <button
                          onClick={() => handleStatusChange(celebration.id, 'rejected', 'Not suitable for church acknowledgment')}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Reject"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(celebration.id, celebration.name)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Celebration Details Modal */}
      {showDetails && selectedCelebration && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Celebration Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Celebrant Information */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-purple-900">Celebrant Information</h4>
                      {getSourceBadge(selectedCelebration)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-purple-700">Name:</span>
                        <p className="text-purple-900">{selectedCelebration.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700">Phone:</span>
                        <p className="text-purple-900">{selectedCelebration.phone}</p>
                      </div>
                      {selectedCelebration.email && (
                        <div>
                          <span className="text-sm font-medium text-purple-700">Email:</span>
                          <p className="text-purple-900">{selectedCelebration.email}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-purple-700">Celebration Type:</span>
                        <p className="text-purple-900">{selectedCelebration.type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700">Date:</span>
                        <p className="text-purple-900">
                          {selectedCelebration.month}/{selectedCelebration.date}
                          {selectedCelebration.year && ` (${selectedCelebration.year})`}
                        </p>
                      </div>
                      {selectedCelebration.member && (
                        <div>
                          <span className="text-sm font-medium text-purple-700">Member Info:</span>
                          <p className="text-purple-900">{selectedCelebration.member.name}</p>
                          {selectedCelebration.member.department && (
                            <p className="text-sm text-purple-700">{selectedCelebration.member.department}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  {selectedCelebration.message && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Message:</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900 text-sm">{selectedCelebration.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Pictures */}
                  {selectedCelebration.pictures && selectedCelebration.pictures.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Pictures ({selectedCelebration.pictures.length}):
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedCelebration.pictures.map((picture, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={picture} 
                              alt={`Celebration ${index + 1}`} 
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75"
                              onClick={() => window.open(picture, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                              <i className="ri-external-link-line text-white opacity-0 group-hover:opacity-100 text-xl"></i>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Status Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Status Information:</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedCelebration.status)}`}>
                          <i className={`${getStatusIcon(selectedCelebration.status)} mr-1`}></i>
                          {selectedCelebration.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Submitted:</span>
                        <span className="text-sm text-gray-900">{formatDate(selectedCelebration.createdAt)}</span>
                      </div>
                      {selectedCelebration.acknowledgedDate && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Acknowledged:</span>
                          <span className="text-sm text-gray-900">{formatDate(selectedCelebration.acknowledgedDate)}</span>
                        </div>
                      )}
                      {selectedCelebration.approvedBy && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Processed by:</span>
                          <span className="text-sm text-gray-900">{selectedCelebration.approvedBy.name}</span>
                        </div>
                      )}
                      {selectedCelebration.rejectionReason && (
                        <div>
                          <span className="text-sm text-gray-600">Rejection Reason:</span>
                          <p className="text-sm text-gray-900 mt-1 p-2 bg-red-50 rounded">{selectedCelebration.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {selectedCelebration.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleStatusChange(selectedCelebration.id, 'approved');
                            setShowDetails(false);
                          }}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <i className="ri-check-line mr-2"></i>
                          Approve Celebration
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Please provide a reason for rejection (optional):');
                            handleStatusChange(selectedCelebration.id, 'rejected', reason || 'Not suitable for church acknowledgment');
                            setShowDetails(false);
                          }}
                          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <i className="ri-close-line mr-2"></i>
                          Reject Celebration
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowDetails(false)}
                      className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CelebrationsManagement;