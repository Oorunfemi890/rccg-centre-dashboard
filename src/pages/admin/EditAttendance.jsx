import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { attendanceAPI } from '@/services/attendanceAPI';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

const EditAttendance = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { admin } = useAuth();
  
  const [formData, setFormData] = useState({
    date: '',
    serviceType: '',
    totalAttendance: '',
    adults: '',
    youth: '',
    children: '',
    visitors: '',
    members: []
  });

  const [originalData, setOriginalData] = useState(null);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMemberSelection, setShowMemberSelection] = useState(false);

  useEffect(() => {
    fetchAttendanceRecord();
    fetchServiceTypes();
    fetchMembers();
  }, [id]);

  useEffect(() => {
    // Auto-calculate total attendance
    const adults = parseInt(formData.adults) || 0;
    const youth = parseInt(formData.youth) || 0;
    const children = parseInt(formData.children) || 0;
    const visitors = parseInt(formData.visitors) || 0;
    
    const calculatedTotal = adults + youth + children + visitors;
    
    if (calculatedTotal !== parseInt(formData.totalAttendance)) {
      setFormData(prev => ({
        ...prev,
        totalAttendance: calculatedTotal.toString()
      }));
    }
  }, [formData.adults, formData.youth, formData.children, formData.visitors]);

  const fetchAttendanceRecord = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAttendanceById(id);
      
      if (response.success) {
        const record = response.data;
        setOriginalData(record);
        setFormData({
          date: record.date,
          serviceType: record.serviceType,
          totalAttendance: record.totalAttendance.toString(),
          adults: record.adults.toString(),
          youth: record.youth.toString(),
          children: record.children.toString(),
          visitors: record.visitors.toString(),
          members: record.members || []
        });
        
        // Show member selection if there are members in the record
        if (record.members && record.members.length > 0) {
          setShowMemberSelection(true);
        }
      } else {
        toast.error(response.message);
        navigate('/admin/attendance');
      }
    } catch (error) {
      console.error('Error fetching attendance record:', error);
      toast.error('Failed to load attendance record');
      navigate('/admin/attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const response = await attendanceAPI.getServiceTypes();
      if (response.success) {
        setServiceTypes(response.data);
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await attendanceAPI.getMembersForAttendance();
      if (response.success) {
        setAvailableMembers(response.data);
        
        // Initialize member attendance tracking with existing data
        const memberAttendance = response.data.map(member => {
          const existingRecord = formData.members.find(m => m.memberId === member.id);
          return {
            memberId: member.id,
            name: member.name,
            present: existingRecord ? existingRecord.present : false,
            timeArrived: existingRecord ? existingRecord.timeArrived : ''
          };
        });
        setSelectedMembers(memberAttendance);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberAttendanceChange = (memberId, field, value) => {
    setSelectedMembers(prev =>
      prev.map(member =>
        member.memberId === memberId
          ? { ...member, [field]: value }
          : member
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.serviceType) {
      toast.error('Please select a service type');
      return;
    }

    if (!formData.totalAttendance || parseInt(formData.totalAttendance) < 0) {
      toast.error('Please enter a valid total attendance');
      return;
    }

    try {
      setSaving(true);

      const attendanceData = {
        ...formData,
        totalAttendance: parseInt(formData.totalAttendance),
        adults: parseInt(formData.adults) || 0,
        youth: parseInt(formData.youth) || 0,
        children: parseInt(formData.children) || 0,
        visitors: parseInt(formData.visitors) || 0,
        members: selectedMembers
      };

      const response = await attendanceAPI.updateAttendance(id, attendanceData);

      if (response.success) {
        toast.success('Attendance updated successfully!');
        navigate('/admin/attendance');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this attendance record? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await attendanceAPI.deleteAttendance(id);

      if (response.success) {
        toast.success('Attendance record deleted successfully!');
        navigate('/admin/attendance');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast.error('Failed to delete attendance record');
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  const presentCount = selectedMembers.filter(m => m.present).length;
  const absentCount = selectedMembers.length - presentCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading attendance record...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Attendance</h1>
          <p className="text-gray-600 mt-1">
            Editing attendance for {originalData?.serviceType} on {new Date(originalData?.date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ri-delete-bin-line mr-2"></i>
            Delete Record
          </button>
          <button
            onClick={() => navigate('/admin/attendance')}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Attendance
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Service Type</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Numbers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Count</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adults
              </label>
              <input
                type="number"
                name="adults"
                value={formData.adults}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Youth
              </label>
              <input
                type="number"
                name="youth"
                value={formData.youth}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Children
              </label>
              <input
                type="number"
                name="children"
                value={formData.children}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visitors
              </label>
              <input
                type="number"
                name="visitors"
                value={formData.visitors}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total *
              </label>
              <input
                type="number"
                name="totalAttendance"
                value={formData.totalAttendance}
                onChange={handleInputChange}
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                placeholder="0"
                readOnly
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <i className="ri-information-line mr-2"></i>
              Total attendance is automatically calculated from the breakdown above.
            </p>
          </div>
        </div>

        {/* Member Attendance Toggle */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Member Attendance</h2>
              <p className="text-sm text-gray-600">Track individual member attendance (optional)</p>
            </div>
            <button
              type="button"
              onClick={() => setShowMemberSelection(!showMemberSelection)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showMemberSelection 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {showMemberSelection ? 'Hide Members' : 'Track Members'}
            </button>
          </div>

          {showMemberSelection && (
            <div className="space-y-4">
              {/* Member Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
              </div>

              {/* Attendance Summary */}
              <div className="flex space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Present: {presentCount}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Absent: {absentCount}</span>
                </div>
              </div>

              {/* Member List */}
              {loadingMembers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading members...</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <div className="space-y-1 p-2">
                    {filteredMembers.map(member => {
                      const memberAttendance = selectedMembers.find(m => m.memberId === member.id);
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={memberAttendance?.present || false}
                              onChange={(e) => handleMemberAttendanceChange(member.id, 'present', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.department}</p>
                            </div>
                          </div>
                          {memberAttendance?.present && (
                            <div className="flex items-center">
                              <label className="text-xs text-gray-600 mr-2">Arrival time:</label>
                              <input
                                type="time"
                                value={memberAttendance.timeArrived}
                                onChange={(e) => handleMemberAttendanceChange(member.id, 'timeArrived', e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {filteredMembers.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No members found matching your search.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/attendance')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? 'Updating...' : 'Update Attendance'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAttendance;