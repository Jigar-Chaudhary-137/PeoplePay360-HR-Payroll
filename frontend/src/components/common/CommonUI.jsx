import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${maxWidth} p-6 sm:p-8 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 mb-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-slate-100">{title}</h3>
            {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ status, text, size = 'sm' }) {
  const norm = (status || text || '').toLowerCase().replace(/\s+/g, '-');
  return (
    <span className={`badge badge-${norm}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-90" />
      {text || status}
    </span>
  );
}

export function LoadingSpinner({ text = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-4">
      <div className="w-10 h-10 border-3 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      <p className="text-sm font-semibold tracking-wide text-slate-300">{text}</p>
    </div>
  );
}

export function ErrorState({ title = 'Failed to load data', message, onRetry }) {
  return (
    <div className="glass-card p-8 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
        <AlertCircle size={24} />
      </div>
      <div>
        <h4 className="text-lg font-bold text-slate-100">{title}</h4>
        {message && <p className="text-sm text-slate-400 max-w-md mt-1">{message}</p>}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          Try Again
        </button>
      )}
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12">
          <ErrorState
            title="Something went wrong displaying this page"
            message={this.state.error?.message || 'An unexpected rendering error occurred.'}
            onRetry={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
      {Icon ? (
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20 shadow-lg shadow-sky-500/10">
          <Icon size={32} />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4 border border-white/10">
          <AlertCircle size={32} />
        </div>
      )}
      <h4 className="text-xl font-bold text-slate-100">{title}</h4>
      {description && <p className="text-sm text-slate-400 max-w-md mt-2 mb-6 leading-relaxed">{description}</p>}
      {actionText && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'sky' }) {
  const colorMap = {
    sky: 'from-sky-500/20 to-transparent text-sky-400 border-sky-500/30',
    emerald: 'from-emerald-500/20 to-transparent text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-500/20 to-transparent text-amber-400 border-amber-500/30',
    purple: 'from-purple-500/20 to-transparent text-purple-400 border-purple-500/30',
    rose: 'from-rose-500/20 to-transparent text-rose-400 border-rose-500/30'
  };

  return (
    <div className="glass-card glass-card-interactive p-6 relative overflow-hidden group">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorMap[color]}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-100 mt-2 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1.5 font-medium">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${colorMap[color]} border transition-transform group-hover:scale-110 shadow-lg`}>
            <Icon size={24} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center text-xs text-slate-300">
          <span className={trend.isPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {trend.value}
          </span>
          <span className="ml-2 font-medium">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
