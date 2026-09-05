import React from 'react';
import { Check } from 'lucide-react';

/**
 * Reusable accessible Checkbox component
 */
export const Checkbox = ({
  id,
  name,
  label,
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => {
  const inputId = id || name;

  return (
    <label
      htmlFor={inputId}
      className={`custom-checkbox-label ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.625rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        fontSize: '0.875rem',
        color: disabled ? '#94A3B8' : '#475569'
      }}
    >
      <div style={{ position: 'relative', width: '1.125rem', height: '1.125rem', flexShrink: 0 }}>
        <input
          id={inputId}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          style={{
            position: 'absolute',
            opacity: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          {...props}
        />
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '0.25rem',
            border: `1.5px solid ${checked ? '#2563EB' : '#CBD5E1'}`,
            backgroundColor: checked ? '#2563EB' : disabled ? '#F1F5F9' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease-in-out',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          {checked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
        </div>
      </div>

      {label && <span style={{ fontWeight: 400 }}>{label}</span>}
    </label>
  );
};

export default Checkbox;
