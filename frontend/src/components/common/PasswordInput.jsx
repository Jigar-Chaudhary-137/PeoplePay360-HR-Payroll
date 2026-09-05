import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

/**
 * Reusable accessible Password Input with Show/Hide toggle
 */
export const PasswordInput = ({
  id,
  name = 'password',
  label = 'Password',
  value,
  onChange,
  onBlur,
  placeholder = '••••••••',
  error,
  helperText,
  required = false,
  disabled = false,
  autoComplete = 'current-password',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={`form-group ${className}`} style={{ marginBottom: '1.25rem' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#334155',
            marginBottom: '0.375rem'
          }}
        >
          {label}
          {required && <span style={{ color: '#EF4444', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}

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
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId || helperId}
          style={{
            width: '100%',
            height: '2.75rem',
            padding: '0.5rem 2.75rem 0.5rem 2.625rem',
            fontSize: '0.9375rem',
            color: '#0F172A',
            backgroundColor: disabled ? '#F1F5F9' : '#FFFFFF',
            border: `1.5px solid ${error ? '#EF4444' : '#CBD5E1'}`,
            borderRadius: '0.5rem',
            outline: 'none',
            transition: 'all 0.15s ease-in-out',
            boxShadow: error
              ? '0 0 0 3px rgba(239, 68, 68, 0.15)'
              : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = '#2563EB';
              e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
            }
          }}
          onBlurCapture={(e) => {
            if (!error) {
              e.target.style.borderColor = '#CBD5E1';
              e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
            }
          }}
          {...props}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: '0.625rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: '#64748B',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '0.375rem',
            borderRadius: '0.375rem',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.color = '#0F172A';
          }}
          onMouseLeave={(e) => {
            if (!disabled) e.currentTarget.style.color = '#64748B';
          }}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          style={{
            fontSize: '0.8125rem',
            color: '#DC2626',
            marginTop: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={helperId}
          style={{
            fontSize: '0.8125rem',
            color: '#64748B',
            marginTop: '0.375rem'
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;
