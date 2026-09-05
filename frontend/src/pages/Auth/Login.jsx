import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../layouts/AuthLayout';
import { TextInput } from '../../components/common/TextInput';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Checkbox } from '../../components/common/Checkbox';
import { Button } from '../../components/common/Button';
import { FormMessage } from '../../components/common/FormMessage';
import { Mail, Shield, Sparkles, Lock, ArrowRight } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const handleQuickFill = (email, password) => {
    setFormData({ email, password, rememberMe: true });
    setErrors({});
    setTouched({ email: true, password: true });
    setServerMessage(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

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

        setTimeout(() => {
          if (role === 'Employee') {
            navigate('/self-service', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 300);
      } else {
        const errMsg = res?.error || res?.message || 'Invalid email or password. Please try again.';
        setServerMessage({
          type: 'error',
          message: errMsg
        });
      }
    } catch (err) {
      setServerMessage({
        type: 'error',
        message: err.message || 'Authentication failed. Please check your credentials.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="glass-card p-8 sm:p-10 shadow-2xl border border-white/15">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Sign In to PeoplePay<span className="text-sky-400">360</span>
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Enter your work credentials to access your HR & payroll operations platform.
          </p>
        </div>

        {/* Global Alert */}
        {serverMessage && (
          <div className="mb-6">
            <FormMessage
              type={serverMessage.type}
              message={serverMessage.message}
              onClose={() => setServerMessage(null)}
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
              className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            loadingText="Signing in…"
            icon={ArrowRight}
            iconPosition="right"
          >
            Sign in to Platform
          </Button>
        </form>

        {/* Quick Demo Credentials Access */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            <Sparkles size={14} className="text-sky-400 animate-pulse" />
            <span>Quick Demo Persona Access</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              className="p-3 rounded-xl bg-slate-900/80 hover:bg-white/10 border border-white/10 text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-sky-400">Admin</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">admin@...</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('priya.patel@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              className="p-3 rounded-xl bg-slate-900/80 hover:bg-white/10 border border-white/10 text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-sky-400">HR Manager</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">priya.patel@...</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('amit.singh@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              className="p-3 rounded-xl bg-slate-900/80 hover:bg-white/10 border border-white/10 text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-sky-400">Payroll Admin</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">amit.singh@...</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('rahul.sharma@peoplepay360.com', 'Password@123')}
              disabled={isLoading}
              className="p-3 rounded-xl bg-slate-900/80 hover:bg-white/10 border border-white/10 text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-sky-400">Employee</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">rahul.sharma@...</div>
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <Shield size={14} className="text-emerald-400" />
          <span>256-bit SSL encrypted & JWT authenticated</span>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
