import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, loading, isAuthenticated, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear form errors when auth error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (result.success) {
        // Remember me functionality
        if (formData.rememberMe) {
          try {
            localStorage.setItem('rememberedEmail', formData.email);
          } catch (e) {
            console.warn('Could not save remembered email');
          }
        } else {
          try {
            localStorage.removeItem('rememberedEmail');
          } catch (e) {
            console.warn('Could not remove remembered email');
          }
        }

        const from = location.state?.from?.pathname || '/admin/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    try {
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      if (rememberedEmail) {
        setFormData(prev => ({
          ...prev,
          email: rememberedEmail,
          rememberMe: true
        }));
      }
    } catch (e) {
      console.warn('Could not load remembered email');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <div className="text-center">
          <Link to="/" className="flex justify-center">
            <img src="/img/favicon.png" alt="RCCG Logo" className="h-16 w-16" />
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Admin Sign In
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter your email address"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <i className={`ri-mail-line text-gray-400 ${errors.email ? 'text-red-400' : ''}`}></i>
                </div>
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <i className="ri-error-warning-line mr-1"></i>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full px-3 py-2 pr-10 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-gray-400 hover:text-gray-600`}></i>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <i className="ri-error-warning-line mr-1"></i>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link 
                  to="/forgot-password" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors"
              >
                {loading && (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
                <span className={loading ? 'ml-3' : ''}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </span>
              </button>
            </div>

            {/* Demo Credentials */}
            {/* <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Credentials:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Super Admin:</strong> admin@rccglcc.org / admin123</p>
                <p><strong>Admin:</strong> sarah@rccglcc.org / sarah123</p>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      email: 'admin@rccglcc.org',
                      password: 'admin123'
                    }));
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  disabled={loading}
                >
                  Use Super Admin credentials
                </button>
              </div>
            </div> */}
          </form>

          {/* Back to Website */}
          {/* <div className="mt-6 text-center">
            <Link 
              to="https://rccg-center.netlify.app/" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <i className="ri-arrow-left-line mr-1"></i>
              Back to website
            </Link>
          </div> */}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          <i className="ri-shield-check-line mr-1"></i>
          Your login is secured with industry-standard encryption and security measures.
        </p>
      </div>
    </div>
  );
};

export default Login;