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
      <div className="glass-card p-8 sm:p-10 shadow-xl border-[#DDD9E8] bg-white text-[#17151F]">
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

        {/* Demo Quick-Fill Access Chips */}
        <div className="mt-8 pt-6 border-t border-dashed border-[#DDD9E8]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#625E6E] mb-3">
            <Sparkles size={14} className="text-[#6C3FF5]" />
            <span>Quick Demo Access</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              className="flex flex-col items-start p-2.5 rounded-xl border border-[#DDD9E8] bg-[#F8F8FC] hover:bg-[#F1ECFF] hover:border-[#6C3FF5] text-left transition-all group"
            >
              <span className="text-xs font-bold text-[#17151F] group-hover:text-[#6C3FF5]">Admin</span>
              <span className="text-[10px] text-[#625E6E] truncate">admin@...</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('priya.patel@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              className="flex flex-col items-start p-2.5 rounded-xl border border-[#DDD9E8] bg-[#F8F8FC] hover:bg-[#F1ECFF] hover:border-[#6C3FF5] text-left transition-all group"
            >
              <span className="text-xs font-bold text-[#17151F] group-hover:text-[#6C3FF5]">HR Manager</span>
              <span className="text-[10px] text-[#625E6E] truncate">priya.patel@...</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('amit.singh@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              className="flex flex-col items-start p-2.5 rounded-xl border border-[#DDD9E8] bg-[#F8F8FC] hover:bg-[#F1ECFF] hover:border-[#6C3FF5] text-left transition-all group"
            >
              <span className="text-xs font-bold text-[#17151F] group-hover:text-[#6C3FF5]">Payroll Admin</span>
              <span className="text-[10px] text-[#625E6E] truncate">amit.singh@...</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('rahul.sharma@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              className="flex flex-col items-start p-2.5 rounded-xl border border-[#DDD9E8] bg-[#F8F8FC] hover:bg-[#F1ECFF] hover:border-[#6C3FF5] text-left transition-all group"
            >
              <span className="text-xs font-bold text-[#17151F] group-hover:text-[#6C3FF5]">Employee</span>
              <span className="text-[10px] text-[#625E6E] truncate">rahul.sharma@...</span>
            </button>
          </div>
        </div>

        {/* Privacy & Security Note */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#625E6E]">
          <Shield size={13} className="text-[#6C3FF5]" />
          <span>Protected with 256-bit enterprise encryption</span>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
