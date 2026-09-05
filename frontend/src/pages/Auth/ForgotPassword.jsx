import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { TextInput } from '../../components/common/TextInput';
import { Button } from '../../components/common/Button';
import { FormMessage } from '../../components/common/FormMessage';
import { Mail, ArrowLeft, CheckCircle2, Shield, RefreshCw } from 'lucide-react';

/**
 * Enterprise Forgot Password Page for PeoplePay360
 */
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (val) => {
    if (!val.trim()) {
      return 'Email address is required';
    }
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid work email address';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setServerError('');
    if (touched) {
      setError(validateEmail(val));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const validationError = validateEmail(email);
    setError(validationError);

    if (validationError) return;

    setIsLoading(true);
    setServerError('');

    try {
      // Mock / Contract placeholder request for password reset
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Always show success view to prevent account enumeration attacks
      setIsSubmitted(true);
      setResendCooldown(30);

      // Start countdown timer for resend
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setServerError('An unexpected error occurred while processing your request. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setServerError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setServerError('Failed to resend reset email. Please try again.');
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

        {/* Conditional View: Success Confirmation vs Reset Form */}
        {isSubmitted ? (
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
              Check your inbox
            </h2>

            <p style={{ fontSize: '0.9375rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              If an account exists for <strong style={{ color: '#0F172A' }}>{email}</strong>, we have sent instructions to reset your password.
            </p>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '0.5rem',
                padding: '1rem',
                fontSize: '0.8125rem',
                color: '#64748B',
                textAlign: 'left',
                marginBottom: '1.75rem',
                lineHeight: 1.5
              }}
            >
              <span style={{ fontWeight: 600, color: '#334155' }}>Didn’t receive the email?</span> Check your spam or junk folder, or verify that you entered your registered corporate work email.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="lg" fullWidth>
                  Return to sign in
                </Button>
              </Link>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendCooldown > 0 ? '#94A3B8' : '#2563EB',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  padding: '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  transition: 'color 0.15s ease'
                }}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>
                  {resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Resend reset link'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* DEFAULT FORM STATE */
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
                Forgot your password?
              </h2>
              <p style={{ fontSize: '0.9375rem', color: '#64748B', lineHeight: 1.5 }}>
                Enter your work email address and we’ll send you secure instructions to reset your password.
              </p>
            </div>

            {/* Error message banner if server error occurs */}
            {serverError && (
              <FormMessage
                type="error"
                message={serverError}
                onClose={() => setServerError('')}
              />
            )}

            <form onSubmit={handleSubmit} noValidate>
              <TextInput
                id="reset-email"
                name="email"
                label="Registered Work Email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleBlur}
                placeholder="name@peoplepay360.com"
                error={touched ? error : ''}
                required
                autoComplete="email"
                autoFocus
                icon={Mail}
                disabled={isLoading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                loadingText="Sending reset link..."
                style={{ marginTop: '0.5rem' }}
              >
                Send reset link
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

export default ForgotPassword;
