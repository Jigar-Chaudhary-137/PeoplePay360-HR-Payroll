import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button } from '../../components/common/Button';
import { FormMessage } from '../../components/common/FormMessage';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { authAPI } from '../../services/api';

/**
 * Enterprise Reset Password Page for PeoplePay360
 */
export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validatePassword = (val) => {
    if (!val) {
      return 'New password is required';
    }
    if (val.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return '';
  };

  const validateConfirm = (val, pw) => {
    if (!val) {
      return 'Please confirm your new password';
    }
    if (val !== pw) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const pwErr = validatePassword(password);
    const confErr = validateConfirm(confirmPassword, password);
    setError(pwErr);
    setConfirmError(confErr);

    if (pwErr || confErr) return;

    if (!token || !email) {
      setServerError('Missing reset token or email address. Please request a new password reset link.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authAPI.resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword: password
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setServerError(res.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setServerError(err.message || 'This reset link is invalid or has expired. Please request a new link.');
    } finally {
      setIsLoading(false);
    }
  };

  const isLinkInvalid = !token || !email;

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
        {/* Back Link */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#64748B',
              textDecoration: 'none',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            <ArrowLeft size={16} />
            <span>Back to sign in</span>
          </Link>
        </div>

        {isSuccess ? (
          /* SUCCESS STATE */
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                border: '4px solid #F0FDF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}
            >
              <CheckCircle2 size={32} color="#16A34A" />
            </div>

            <h2
              style={{
                fontSize: '1.625rem',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.025em',
                marginBottom: '0.75rem'
              }}
            >
              Password reset complete
            </h2>

            <p style={{ fontSize: '0.9375rem', color: '#475569', lineHeight: 1.6, marginBottom: '2rem' }}>
              Your account password has been securely updated. You can now sign in to PeoplePay360 with your new credentials.
            </p>

            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" fullWidth>
                Sign in with new password
              </Button>
            </Link>
          </div>
        ) : isLinkInvalid ? (
          /* INVALID LINK STATE */
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                border: '4px solid #FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}
            >
              <AlertCircle size={32} color="#DC2626" />
            </div>

            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.025em',
                marginBottom: '0.75rem'
              }}
            >
              Invalid reset link
            </h2>

            <p style={{ fontSize: '0.9375rem', color: '#64748B', lineHeight: 1.6, marginBottom: '2rem' }}>
              This password reset link is missing required security parameters or has expired. Please request a new link.
            </p>

            <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" fullWidth>
                Request a new reset link
              </Button>
            </Link>
          </div>
        ) : (
          /* FORM STATE */
          <div>
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
                Set new password
              </h2>
              <p style={{ fontSize: '0.9375rem', color: '#64748B', lineHeight: 1.5 }}>
                Enter your new password for account <strong style={{ color: '#0F172A' }}>{email}</strong>.
              </p>
            </div>

            {serverError && (
              <FormMessage
                type="error"
                message={serverError}
                onClose={() => setServerError('')}
              />
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* New Password Field */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="new-password"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#334155',
                    marginBottom: '0.375rem'
                  }}
                >
                  New Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                      color: error ? '#EF4444' : '#94A3B8'
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(validatePassword(e.target.value));
                      if (confirmPassword) setConfirmError(validateConfirm(confirmPassword, e.target.value));
                      setServerError('');
                    }}
                    placeholder="Enter at least 8 characters"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      height: '2.75rem',
                      padding: '0.5rem 2.625rem 0.5rem 2.625rem',
                      fontSize: '0.9375rem',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      border: `1.5px solid ${error ? '#EF4444' : '#CBD5E1'}`,
                      borderRadius: '0.5rem',
                      outline: 'none',
                      boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.875rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && (
                  <p style={{ fontSize: '0.8125rem', color: '#DC2626', marginTop: '0.375rem' }}>{error}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="confirm-password"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#334155',
                    marginBottom: '0.375rem'
                  }}
                >
                  Confirm New Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                      color: confirmError ? '#EF4444' : '#94A3B8'
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmError(validateConfirm(e.target.value, password));
                      setServerError('');
                    }}
                    placeholder="Re-enter your new password"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      height: '2.75rem',
                      padding: '0.5rem 2.625rem 0.5rem 2.625rem',
                      fontSize: '0.9375rem',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      border: `1.5px solid ${confirmError ? '#EF4444' : '#CBD5E1'}`,
                      borderRadius: '0.5rem',
                      outline: 'none',
                      boxShadow: confirmError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.875rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmError && (
                  <p style={{ fontSize: '0.8125rem', color: '#DC2626', marginTop: '0.375rem' }}>{confirmError}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                loadingText="Updating password..."
              >
                Reset Password
              </Button>
            </form>
          </div>
        )}

        {/* Security Note */}
        <div
          style={{
            marginTop: '2rem',
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

export default ResetPassword;
