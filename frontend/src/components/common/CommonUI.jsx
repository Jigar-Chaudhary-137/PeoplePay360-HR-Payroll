import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl'
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${maxWidth} p-6 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#E5E7EB]">
          <div>
            <h3 className="text-xl font-bold text-[#171717]">{title}</h3>
            {subtitle && (
              <p className="text-sm text-[#6B7280] mt-0.5">{subtitle}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#171717] p-1 rounded-lg hover:bg-[#FAF7FF] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ status, text, size = 'sm' }) {
  const norm = (status || text || '')
    .toLowerCase()
    .replace(/\s+/g, '-');

  return (
    <span className={`badge badge-${norm}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {text || status}
    </span>
  );
}

export function LoadingSpinner({ text = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-[#6B7280] space-y-3">
      <div className="w-8 h-8 border-2 border-[#6D28D9]/20 border-t-[#6D28D9] rounded-full animate-spin" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

export function ErrorState({
  title = 'Failed to load data',
  message,
  onRetry
}) {
  return (
    <div className="glass-card p-8 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
        <AlertCircle size={24} />
      </div>

      <div>
        <h4 className="text-lg font-bold text-slate-100">
          {title}
        </h4>

        {message && (
          <p className="text-sm text-slate-400 max-w-md mt-1">
            {message}
          </p>
        )}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary text-xs"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      'ErrorBoundary caught an error:',
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12">
          <ErrorState
            title="Something went wrong displaying this page"
            message={
              this.state.error?.message ||
              'An unexpected rendering error occurred.'
            }
            onRetry={() => {
              this.setState({
                hasError: false,
                error: null
              });

              window.location.reload();
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction
}) {
  return (
    <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center mb-4 border border-[#E5E7EB]">
          <Icon size={28} />
        </div>
      )}

      <h4 className="text-lg font-bold text-[#171717]">
        {title}
      </h4>

      {description && (
        <p className="text-sm text-[#6B7280] max-w-sm mt-1 mb-5">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'purple'
}) {
  const colorMap = {
    purple:
      'bg-[#F3E8FF] text-[#6D28D9] border-[#E5E7EB]',
    sky:
      'bg-blue-50 text-blue-600 border-blue-100',
    emerald:
      'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber:
      'bg-amber-50 text-amber-600 border-amber-100',
    rose:
      'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] font-heading">
            {title}
          </p>

          <h3 className="text-2xl font-extrabold text-[#171717] mt-1 font-heading">
            {value}
          </h3>

          {subtitle && (
            <p className="text-xs text-[#6B7280] mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`p-3 rounded-xl ${
              colorMap[color] || colorMap.purple
            } border transition-transform group-hover:scale-105`}
          >
            <Icon size={22} />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex items-center text-xs text-[#6B7280]">
          <span
            className={
              trend.isPositive
                ? 'text-emerald-600 font-semibold'
                : 'text-rose-600 font-semibold'
            }
          >
            {trend.value}
          </span>

          <span className="ml-1.5">
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
