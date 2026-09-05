import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button component matching PeoplePay360 Dark Glassmorphism Design System
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

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    outline: 'btn-secondary border-sky-500/40 text-sky-300 hover:bg-sky-500/10',
    ghost: 'bg-transparent hover:bg-white/10 text-slate-300 border-transparent shadow-none'
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'min-h-[48px] px-6 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${variantClasses[variant] || 'btn-primary'} ${sizeClasses[size] || ''} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      style={style}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>{loadingText || 'Processing...'}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={18} className="shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={18} className="shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
