import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button component with Loading states and Variants
 */
export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingText,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem', height: '2.125rem' },
    md: { padding: '0.625rem 1.25rem', fontSize: '0.9375rem', height: '2.75rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem', height: '3rem' }
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
      border: '1px solid #2563EB',
      boxShadow: '0 1px 3px 0 rgba(37, 99, 235, 0.3), 0 1px 2px -1px rgba(37, 99, 235, 0.2)'
    },
    secondary: {
      backgroundColor: '#F8FAFC',
      color: '#334155',
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#2563EB',
      border: '1.5px solid #2563EB',
      boxShadow: 'none'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#475569',
      border: 'none',
      boxShadow: 'none'
    },
    danger: {
      backgroundColor: '#DC2626',
      color: '#FFFFFF',
      border: '1px solid #DC2626',
      boxShadow: '0 1px 3px 0 rgba(220, 38, 38, 0.3)'
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`custom-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: 600,
        borderRadius: '0.5rem',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.7 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.15s ease-in-out',
        userSelect: 'none',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          if (variant === 'primary') e.currentTarget.style.backgroundColor = '#1D4ED8';
          if (variant === 'secondary') e.currentTarget.style.backgroundColor = '#F1F5F9';
          if (variant === 'outline') e.currentTarget.style.backgroundColor = '#EFF6FF';
          if (variant === 'ghost') e.currentTarget.style.backgroundColor = '#F1F5F9';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          if (variant === 'primary') e.currentTarget.style.backgroundColor = '#2563EB';
          if (variant === 'secondary') e.currentTarget.style.backgroundColor = '#F8FAFC';
          if (variant === 'outline') e.currentTarget.style.backgroundColor = 'transparent';
          if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>{loadingText || 'Please wait...'}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={18} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={18} />}
        </>
      )}
    </button>
  );
};

export default Button;
