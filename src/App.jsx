import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

// Auth Components
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin Components
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MembersManagement from "./pages/admin/MembersManagement";
import AttendanceManagement from "./pages/admin/AttendanceManagement";
import EventsManagement from "./pages/admin/EventsManagement";
import CelebrationsManagement from "./pages/admin/CelebrationsManagement";
import AdminProfile from "./pages/admin/AdminProfile";

// Additional Admin Components
import NewMember from "./pages/admin/NewMember";
import EditMember from "./pages/admin/EditMember";
import NewAttendance from "./pages/admin/NewAttendance";
import EditAttendance from "./pages/admin/EditAttendance";
import NewEvent from "./pages/admin/NewEvent";
import EditEvent from "./pages/admin/EditEvent";

// Create React Query client with default options for admin
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors (auth errors)
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

const AdminApp = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WebSocketProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Admin Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard */}
                <Route path="dashboard" element={<AdminDashboard />} />

                {/* Members Management */}
                <Route
                  path="members"
                  element={
                    <ProtectedRoute requiredPermission="members">
                      <MembersManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="members/new"
                  element={
                    <ProtectedRoute requiredPermission="members">
                      <NewMember />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="members/:id/edit"
                  element={
                    <ProtectedRoute requiredPermission="members">
                      <EditMember />
                    </ProtectedRoute>
                  }
                />

                {/* Attendance Management */}
                <Route
                  path="attendance"
                  element={
                    <ProtectedRoute requiredPermission="manage_attendance">
                      <AttendanceManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="attendance/new"
                  element={
                    <ProtectedRoute requiredPermission="manage_attendance">
                      <NewAttendance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="attendance/:id/edit"
                  element={
                    <ProtectedRoute requiredPermission="manage_attendance">
                      <EditAttendance />
                    </ProtectedRoute>
                  }
                />

                {/* Events Management */}
                <Route
                  path="events"
                  element={
                    <ProtectedRoute requiredPermission="events">
                      <EventsManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="events/new"
                  element={
                    <ProtectedRoute requiredPermission="events">
                      <NewEvent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="events/:id/edit"
                  element={
                    <ProtectedRoute requiredPermission="events">
                      <EditEvent />
                    </ProtectedRoute>
                  }
                />

                {/* Celebrations Management */}
                <Route
                  path="celebrations"
                  element={
                    <ProtectedRoute requiredPermission="celebrations">
                      <CelebrationsManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Profile */}
                <Route path="profile" element={<AdminProfile />} />

                {/* Default redirect to dashboard */}
                <Route index element={<AdminDashboard />} />
              </Route>

              {/* 404 Catch All for Admin */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8 text-center">
                      <div>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                          404 - Admin Page Not Found
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                          The admin page you're looking for doesn't exist.
                        </p>
                      </div>
                      <div>
                        <a
                          href="/dashboard"
                          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Go to Dashboard
                        </a>
                      </div>
                    </div>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WebSocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default AdminApp;
