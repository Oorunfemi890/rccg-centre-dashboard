import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI } from "@/Services/authApi";
import { toast } from "react-toastify";

// Verification Modal Component
const VerificationModal = ({
  isOpen,
  onClose,
  onVerify,
  title,
  description,
  loading,
  tokenType = "profile",
}) => {
  const [token, setToken] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (token.length < 10) {
      toast.error("Please enter a valid verification token");
      return;
    }
    onVerify(token);
  };

  const handleClose = () => {
    setToken("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <i
                className={`${
                  tokenType === "password"
                    ? "ri-shield-keyhole-line text-red-600"
                    : "ri-verified-badge-line text-blue-600"
                } mr-2 text-xl`}
              ></i>
              {title}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">{description}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\s/g, ""))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg tracking-wider"
                placeholder="Enter verification token"
                maxLength={64}
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Check your email for the verification token
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !token}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  tokenType === "password"
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                } transition-colors flex items-center justify-center`}
              >
                {loading && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminProfile = () => {
  const { admin, updateProfile, logout } = useAuth();

  const [profileData, setProfileData] = useState({
    name: admin?.name || "",
    email: admin?.email || "",
    phone: admin?.phone || "",
    position: admin?.position || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Modal states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState(null);
  const [pendingPasswordData, setPendingPasswordData] = useState(null);

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (profileErrors[name]) {
      setProfileErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (profileData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!profileData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!profileData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    } else if (passwordData.currentPassword.length < 6) {
      newErrors.currentPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (
      passwordData.currentPassword &&
      passwordData.newPassword &&
      passwordData.currentPassword === passwordData.newPassword
    ) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const emailChanged =
      profileData.email.toLowerCase() !== admin.email.toLowerCase();

    if (emailChanged) {
      setPendingProfileData(profileData);

      try {
        setProfileLoading(true);
        const response = await authAPI.requestProfileUpdate("email");

        if (response.success) {
          setShowVerificationModal(true);
          toast.success("Verification token sent to your email");
        } else {
          toast.error(response.message || "Failed to send verification token");
        }
      } catch (error) {
        console.error("Error requesting profile update:", error);
        toast.error(error.message || "Failed to request profile update");
      } finally {
        setProfileLoading(false);
      }
    } else {
      try {
        setProfileLoading(true);
        const result = await updateProfile({
          ...profileData,
        });

        if (result.success) {
          setIsEditing(false);
          toast.success("Profile updated successfully!");
        } else {
          toast.error(result.message || "Failed to update profile");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error(error.message || "Failed to update profile");
      } finally {
        setProfileLoading(false);
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setPasswordLoading(true);

      console.log("Requesting password change verification...");

      const response = await authAPI.requestPasswordChange(
        passwordData.currentPassword
      );

      console.log("Password change request response:", response);

      if (response.success) {
        setPendingPasswordData(passwordData);
        setShowPasswordModal(true);
        toast.success(
          "Verification token sent to your email. Check your inbox!"
        );
      } else {
        toast.error(response.message || "Failed to send verification token");
        console.error("Password change request failed:", response);
      }
    } catch (error) {
      console.error("Error requesting password change:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to request password change";
      toast.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileVerification = async (token) => {
    if (!pendingProfileData) {
      toast.error("No pending profile data. Please try again.");
      setShowVerificationModal(false);
      return;
    }

    try {
      setVerificationLoading(true);

      console.log("Verifying profile update with token...");

      const updateData = {
        name: pendingProfileData.name,
        email: pendingProfileData.email,
        phone: pendingProfileData.phone,
        position: pendingProfileData.position,
        token: token.trim(),
      };

      const result = await updateProfile(updateData);

      if (result.success) {
        setShowVerificationModal(false);
        setIsEditing(false);
        setPendingProfileData(null);
        toast.success("Profile updated successfully! Email address changed.");
      } else {
        toast.error(result.message || "Verification failed");
      }
    } catch (error) {
      console.error("Profile verification error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Verification failed";
      toast.error(errorMessage);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handlePasswordVerification = async (token) => {
    if (!pendingPasswordData) {
      toast.error("No pending password data. Please try again.");
      setShowPasswordModal(false);
      return;
    }

    try {
      setVerificationLoading(true);

      console.log("Verifying password change with token...");

      const response = await authAPI.changePassword({
        token: token.trim(),
        newPassword: pendingPasswordData.newPassword,
      });

      console.log("Password change response:", response);

      if (response.success) {
        setShowPasswordModal(false);
        setPendingPasswordData(null);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        toast.success(
          "Password changed successfully! Logging out in 3 seconds...",
          {
            autoClose: 3000,
          }
        );

        setTimeout(async () => {
          await logout();
          window.location.href = "/login";
        }, 3000);
      } else {
        toast.error(response.message || "Password change failed");
      }
    } catch (error) {
      console.error("Password verification error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Verification failed";
      toast.error(errorMessage);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      name: admin?.name || "",
      email: admin?.email || "",
      phone: admin?.phone || "",
      position: admin?.position || "",
    });
    setProfileErrors({});
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Profile Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your account settings and preferences
            </p>
          </div>

          {activeTab === "profile" && (
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <i className="ri-edit-line mr-2"></i>
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                  >
                    <i className="ri-close-line mr-2"></i>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Overview Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {admin?.avatar ? (
                <img
                  src={admin.avatar}
                  alt={admin.name}
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-gray-100"
                />
              ) : (
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-4 ring-gray-100">
                  <i className="ri-user-line text-white text-3xl"></i>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{admin?.name}</h2>
              <p className="text-gray-500">{admin?.position}</p>
              <p className="text-gray-500">{admin?.email}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <i className="ri-shield-check-line mr-1 text-green-500"></i>
                  {admin?.role === "super_admin" ? "Super Admin" : "Admin"}
                </span>
                <span className="flex items-center">
                  <i className="ri-calendar-line mr-1"></i>
                  Joined {formatDate(admin?.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  admin?.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    admin?.isActive ? "bg-green-400" : "bg-red-400"
                  }`}
                ></div>
                {admin?.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "profile"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="ri-user-line mr-2"></i>
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "security"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="ri-shield-keyhole-line mr-2"></i>
                Security
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "activity"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="ri-history-line mr-2"></i>
                Activity Log
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Information Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            profileErrors.name
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {profileData.name}
                        </div>
                      )}
                      {profileErrors.name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <i className="ri-error-warning-line mr-1"></i>
                          {profileErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                        {isEditing &&
                          profileData.email.toLowerCase() !==
                            admin?.email.toLowerCase() && (
                            <span className="text-yellow-600 text-xs ml-1">
                              (Will require verification)
                            </span>
                          )}
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            profileErrors.email
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                          placeholder="Enter your email address"
                        />
                      ) : (
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {profileData.email}
                        </div>
                      )}
                      {profileErrors.email && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <i className="ri-error-warning-line mr-1"></i>
                          {profileErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            profileErrors.phone
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {profileData.phone}
                        </div>
                      )}
                      {profileErrors.phone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <i className="ri-error-warning-line mr-1"></i>
                          {profileErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="position"
                          value={profileData.position}
                          onChange={handleProfileInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your position"
                        />
                      ) : (
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {profileData.position || "Not specified"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {profileLoading && (
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}
                      {profileLoading ? "Updating..." : "Update Profile"}
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Change Password
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <i className="ri-information-line text-yellow-600 mr-2 mt-0.5 text-lg flex-shrink-0"></i>
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Security Notice:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>
                            Changing your password requires email verification
                          </li>
                          <li>You will be logged out of all devices</li>
                          <li>Check your email for the verification token</li>
                          <li>Token expires in 15 minutes</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={handlePasswordSubmit}
                    className="space-y-4 max-w-md"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password *
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          passwordErrors.currentPassword
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter your current password"
                        autoComplete="current-password"
                      />
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <i className="ri-error-warning-line mr-1"></i>
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password *
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          passwordErrors.newPassword
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter your new password"
                        autoComplete="new-password"
                      />
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <i className="ri-error-warning-line mr-1"></i>
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          passwordErrors.confirmPassword
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Confirm your new password"
                        autoComplete="new-password"
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <i className="ri-error-warning-line mr-1"></i>
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {passwordLoading && (
                          <svg
                            className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        <i className="ri-shield-keyhole-line mr-2"></i>
                        {passwordLoading ? "Processing..." : "Change Password"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Security Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                    <i className="ri-shield-check-line mr-2 text-green-600"></i>
                    Security Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Type:</span>
                      <span className="font-medium text-gray-900">
                        {admin?.role === "super_admin"
                          ? "Super Administrator"
                          : "Administrator"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Login:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(admin?.lastLogin)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Status:</span>
                      <span
                        className={`font-medium ${
                          admin?.isActive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {admin?.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Two-Factor Auth:</span>
                      <span className="font-medium text-gray-500">
                        Not Enabled
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Log Tab */}
            {activeTab === "activity" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center">
                          <i className="ri-user-settings-line mr-2 text-blue-600"></i>
                          Profile Updated
                        </p>
                        <p className="text-sm text-gray-600">
                          Personal information was updated
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(admin?.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center">
                          <i className="ri-login-circle-line mr-2 text-green-600"></i>
                          Successful Login
                        </p>
                        <p className="text-sm text-gray-600">
                          Logged in to admin dashboard
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(admin?.lastLogin)}
                      </span>
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center">
                          <i className="ri-user-add-line mr-2 text-purple-600"></i>
                          Account Created
                        </p>
                        <p className="text-sm text-gray-600">
                          Administrator account was created
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(admin?.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Update Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setPendingProfileData(null);
        }}
        onVerify={handleProfileVerification}
        loading={verificationLoading}
        title="Email Change Verification"
        description="To change your email address, please enter the verification token sent to your current email address. This ensures the security of your account."
        tokenType="profile"
      />

      {/* Password Change Verification Modal */}
      <VerificationModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPendingPasswordData(null);
        }}
        onVerify={handlePasswordVerification}
        loading={verificationLoading}
        title="Password Change Verification"
        description="For security reasons, changing your password requires email verification. Please enter the verification token sent to your email address."
        tokenType="password"
      />
    </>
  );
};

export default AdminProfile;
