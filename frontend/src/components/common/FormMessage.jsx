import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Reusable FormMessage / Alert Banner component
 */
export const FormMessage = ({
  type = 'error',
  title,
  message,
  onClose,
  className = '',
  style = {}
}) => {
  if (!message && !title) return null;

  const styles = {
    error: {
      bg: '#FEF2F2',
      border: '#FCA5A5',
      text: '#991B1B',
      icon: <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
    },
    success: {
      bg: '#F0FDF4',
      border: '#86EFAC',
      text: '#166534',
      icon: <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
    },
    warning: {
      bg: '#FFFBEB',
      border: '#FCD34D',
      text: '#92400E',
      icon: <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0 }} />
    },
    info: {
      bg: '#EFF6FF',
      border: '#93C5FD',
      text: '#1E40AF',
      icon: <Info size={18} color="#2563EB" style={{ flexShrink: 0 }} />
    }
  };

  const current = styles[type] || styles.error;

  return (
    <div
      role="alert"
      className={`form-message-alert ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: '0.5rem',
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        color: current.text,
        fontSize: '0.875rem',
        marginBottom: '1.25rem',
        transition: 'all 0.2s ease',
        ...style
      }}
    >
      <div style={{ marginTop: '0.0625rem' }}>{current.icon}</div>

      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: message ? '0.25rem' : 0 }}>{title}</div>}
        {message && <div style={{ lineHeight: 1.45 }}>{message}</div>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          style={{
            background: 'transparent',
            border: 'none',
            color: current.text,
            opacity: 0.7,
            cursor: 'pointer',
            padding: '0.125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default FormMessage;
