import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../layouts/AuthLayout';
import { TextInput } from '../../components/common/TextInput';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Checkbox } from '../../components/common/Checkbox';
import { Button } from '../../components/common/Button';
import { FormMessage } from '../../components/common/FormMessage';
import { Mail, Shield, Sparkles } from 'lucide-react';

/**
 * Enterprise Login Page for PeoplePay360
 */
export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Validation & UI State
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState(null); // { type: 'error'|'warning'|'info'|'success', message: '' }

  // Email Regex Pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validation Logic
  const validateField = (field, value) => {
    let error = '';
    if (field === 'email') {
      if (!value.trim()) {
        error = 'Email address is required';
      } else if (!emailRegex.test(value.trim())) {
        error = 'Please enter a valid work email address';
      }
    } else if (field === 'password') {
      if (!value) {
        error = 'Password is required';
      } else if (value.length < 6) {
        error = 'Password must be at least 6 characters';
      }
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: val }));

    if (serverMessage) setServerMessage(null);

    // Live validation if field has been touched
    if (touched[name] && type !== 'checkbox') {
      const error = validateField(name, val);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Quick-fill Demo Account credentials helper
  const handleQuickFill = (email, password) => {
    setFormData({ email, password, rememberMe: true });
    setErrors({});
    setTouched({ email: true, password: true });
    setServerMessage(null);
  };

  // Form Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validate all fields
    const emailError = validateField('email', formData.email);
    const passwordError = validateField('password', formData.password);

    setTouched({ email: true, password: true });
    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) {
      return;
    }

    setIsLoading(true);
    setServerMessage(null);

    try {
      const res = await login(formData.email.trim(), formData.password);
      const token = res?.token || res?.data?.token;
      const user = res?.user || res?.data?.user;

      if (token && user) {
        const role = user?.role || user?.role_name || 'Employee';

        setServerMessage({
          type: 'success',
          message: `Signed in successfully! Welcome back, ${user?.name || user?.first_name || 'User'}.`
        });

        // Route HR/Payroll roles to /dashboard and standard employees to /self-service
        setTimeout(() => {
          if (role === 'Employee') {
            navigate('/self-service', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 300);
      } else {
        const errMsg = res?.error || res?.message || 'Invalid email or password. Please try again.';
        
        if (errMsg.toLowerCase().includes('inactive') || errMsg.toLowerCase().includes('disabled')) {
          setServerMessage({
            type: 'warning',
            message: 'Your account is currently inactive. Please contact your HR administrator.'
          });
        } else {
          setServerMessage({
            type: 'error',
            message: errMsg
          });
        }
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('network')) {
        setServerMessage({
          type: 'error',
          message: 'Network connection error. Please verify your internet or backend server status.'
        });
      } else {
        setServerMessage({
          type: 'error',
          message: err.message || 'Authentication failed. Please check your credentials.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          padding: '2.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.025em',
              marginBottom: '0.5rem'
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: '0.9375rem', color: '#64748B', lineHeight: 1.5 }}>
            Sign in to manage your people and payroll operations.
          </p>
        </div>

        {/* Global Alert / Status Message */}
        {serverMessage && (
          <FormMessage
            type={serverMessage.type}
            message={serverMessage.message}
            onClose={() => setServerMessage(null)}
          />
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Work Email */}
          <TextInput
            id="login-email"
            name="email"
            label="Work Email Address"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="name@peoplepay360.com"
            error={touched.email ? errors.email : ''}
            required
            autoComplete="email"
            autoFocus
            icon={Mail}
            disabled={isLoading}
          />

          {/* Password */}
          <PasswordInput
            id="login-password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="••••••••"
            error={touched.password ? errors.password : ''}
            required
            autoComplete="current-password"
            disabled={isLoading}
          />

          {/* Remember Me & Forgot Password Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}
          >
            <Checkbox
              id="login-remember"
              name="rememberMe"
              label="Remember me"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              disabled={isLoading}
            />

            <Link
              to="/forgot-password"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#2563EB',
                textDecoration: 'none',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1D4ED8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#2563EB')}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            loadingText="Signing in…"
          >
            Sign in
          </Button>
        </form>

        {/* Demo Quick-Fill Access Chips */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px dashed #E2E8F0'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#64748B',
              marginBottom: '0.75rem'
            }}
          >
            <Sparkles size={14} color="#2563EB" />
            <span>Quick Demo Access</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#93C5FD';
                e.currentTarget.style.backgroundColor = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B' }}>Admin</span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>admin@...</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('priya.patel@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#93C5FD';
                e.currentTarget.style.backgroundColor = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B' }}>HR Manager</span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>priya.patel@...</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('amit.singh@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#93C5FD';
                e.currentTarget.style.backgroundColor = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B' }}>Payroll Admin</span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>amit.singh@...</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('rahul.sharma@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#93C5FD';
                e.currentTarget.style.backgroundColor = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B' }}>Employee</span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>rahul.sharma@...</span>
            </button>
          </div>
        </div>

        {/* Privacy & Security Note */}
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            fontSize: '0.75rem',
            color: '#94A3B8'
          }}
        >
          <Shield size={13} color="#94A3B8" />
          <span>Protected with 256-bit enterprise encryption</span>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
