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

  const demoAccounts = [
    {
      role: 'Admin',
      email: 'admin@peoplepay360.com',
      password: 'Password@123'
    },
    {
      role: 'HR Manager',
      email: 'priya.patel@peoplepay360.com',
      password: 'Password@123'
    },
    {
      role: 'Payroll Admin',
      email: 'amit.singh@peoplepay360.com',
      password: 'Password@123'
    },
    {
      role: 'Employee',
      email: 'rahul.sharma@peoplepay360.com',
      password: 'Password@123'
    }
  ];

  return (
    <AuthLayout>
      <div className="glass-card p-6 sm:p-8 shadow-xl border-[#DDD9E8] bg-white text-[#17151F]">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#17151F] tracking-tight mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-[#625E6E]">
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
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
          <div className="flex items-center justify-between pt-1 pb-2">
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
              className="text-xs font-semibold text-[#6C3FF5] hover:text-[#5125C7] transition-colors"
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

        {/* Quick Demo Access Section */}
        <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#6D28D9]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Quick Demo Access
              </span>
            </div>
            <span className="text-[10px] font-medium text-[#9CA3AF]">
              1-Click Auto-Fill
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {demoAccounts.map((demo) => {
              const isSelected = formData.email.trim().toLowerCase() === demo.email.toLowerCase();

              return (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleQuickFill(demo.email, demo.password)}
                  disabled={isLoading}
                  className={`h-full min-h-[64px] flex flex-col justify-center p-3 rounded-xl border text-left transition-all duration-150 group cursor-pointer select-none shadow-2xs ${
                    isSelected
                      ? 'border-[#6D28D9] bg-[#F5F3FF] ring-1 ring-[#6D28D9]/20'
                      : 'border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#FAF5FF] hover:border-[#6D28D9]/40 hover:shadow-xs active:scale-[0.98]'
                  }`}
                  title={`Auto-fill credentials for ${demo.role}`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-xs font-bold transition-colors leading-tight ${
                        isSelected ? 'text-[#6D28D9]' : 'text-[#111827] group-hover:text-[#6D28D9]'
                      }`}
                    >
                      {demo.role}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6D28D9]" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-normal leading-tight tracking-tight transition-colors ${
                      isSelected ? 'text-[#6D28D9]/80' : 'text-[#6B7280] group-hover:text-[#374151]'
                    }`}
                  >
                    {demo.email}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Privacy & Security Note */}
        <div className="mt-5 pt-1 flex items-center justify-center gap-1.5 text-xs text-[#6B7280]">
          <Shield size={13} className="text-[#10B981]" />
          <span>Protected with 256-bit enterprise encryption</span>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
