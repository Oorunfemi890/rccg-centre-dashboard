import React, { useState, useEffect } from 'react';
import { celebrationsAPI } from '@/services/celebrationsAPI';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

const CelebrationsManagement = () => {
  const { admin } = useAuth();
  const [celebrations, setCelebrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCelebration, setSelectedCelebration] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const celebrationsPerPage = 10;

  useEffect(() => {
    fetchCelebrations();
  }, []);

  const fetchCelebrations = async () => {
    try {
      setLoading(true);
      const response = await celebrationsAPI.getCelebrations();
      
      if (response.success) {
        setCelebrations(response.data);
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

  const handleStatusChange = async (celebrationId, newStatus) => {
    try {
      const updateData = { 
        status: newStatus,
        acknowledgedDate: newStatus === 'approved' ? new Date().toISOString().split('T')[0] : null
      };

      const response = await celebrationsAPI.updateCelebrationStatus(celebrationId, updateData);
      
      if (response.success) {
        setCelebrations(prev => 
          prev.map(celebration => 
            celebration.id === celebrationId 
              ? { ...celebration, ...updateData }
              : celebration
          )
        );
        toast.success(`Celebration ${newStatus} successfully`);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error updating celebration status:', error);
      toast.error('Failed to update celebration status');
    }
  };

  const handleDelete = async (celebrationId, celebrantName) => {
    if (!confirm(`Are you sure you want to delete the celebration request from ${celebrantName}?`)) {
      return;
    }

    try {
      const response = await celebrationsAPI.deleteCelebration(celebrationId);
      
      if (response.success) {
        setCelebrations(prev => prev.filter(celebration => celebration.id !== celebrationId));
        toast.success('Celebration deleted successfully');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error deleting celebration:', error);
      toast.error('Failed to delete celebration');
    }
  };

  // Filter and search logic
  const filteredCelebrations = celebrations.filter(celebration => {
    const matchesSearch = celebration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         celebration.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || celebration.status === filterStatus;
    const matchesType = filterType === 'all' || celebration.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCelebrations.length / celebrationsPerPage);
  const startIndex = (currentPage - 1) * celebrationsPerPage;
  const paginatedCelebrations = filteredCelebrations.slice(startIndex, startIndex + celebrationsPerPage);

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
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const pendingCount = celebrations.filter(c => c.status === 'pending').length;
  const approvedCount = celebrations.filter(c => c.status === 'approved').length;
  const rejectedCount = celebrations.filter(c => c.status === 'rejected').length;

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
          <p className="text-gray-600 mt-1">Review and manage member celebration requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-cake-3-line text-blue-600"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-lg font-semibold text-gray-900">{celebrations.length}</p>
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
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or celebration type..."
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
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterType('all');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Celebrations Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Celebration Requests ({filteredCelebrations.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Celebrant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Celebration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCelebrations.map((celebration) => (
                <tr key={celebration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <i className="ri-user-line text-purple-600"></i>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{celebration.name}</div>
                        <div className="text-sm text-gray-500">{celebration.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{celebration.type}</div>
                    <div className="text-sm text-gray-500">
                      {celebration.month}/{celebration.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {celebration.acknowledgedDate 
                        ? formatDate(celebration.acknowledgedDate)
                        : 'Not acknowledged'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(celebration.status)}`}>
                      <i className={`${getStatusIcon(celebration.status)} mr-1`}></i>
                      {celebration.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(celebration.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(celebration.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      {celebration.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(celebration.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <i className="ri-check-line"></i>
                          </button>
                          <button
                            onClick={() => handleStatusChange(celebration.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(celebration.id, celebration.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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
        {filteredCelebrations.length === 0 && (
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(startIndex + celebrationsPerPage, filteredCelebrations.length)}</span> of{' '}
                    <span className="font-medium">{filteredCelebrations.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Celebration Details Modal */}
      {showDetails && selectedCelebration && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
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
              
              <div className="space-y-6">
                {/* Celebrant Information */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-900 mb-2">Celebrant Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-purple-700">Name:</span>
                      <p className="text-purple-900">{selectedCelebration.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-purple-700">Phone:</span>
                      <p className="text-purple-900">{selectedCelebration.phone}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-purple-700">Celebration Type:</span>
                      <p className="text-purple-900">{selectedCelebration.type}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-purple-700">Date:</span>
                      <p className="text-purple-900">{selectedCelebration.month}/{selectedCelebration.date}</p>
                    </div>
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
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Pictures:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCelebration.pictures.map((picture, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={picture} 
                            alt={`Celebration ${index + 1}`} 
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Status Information:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCelebration.status)}`}>
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
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  {selectedCelebration.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusChange(selectedCelebration.id, 'approved');
                          setShowDetails(false);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                      >
                        <i className="ri-check-line mr-2"></i>
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleStatusChange(selectedCelebration.id, 'rejected');
                          setShowDetails(false);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                      >
                        <i className="ri-close-line mr-2"></i>
                        Reject
                      </button>
                    </>
                  )}
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
        </div>
      )}
    </div>
  );
};

export default CelebrationsManagement;