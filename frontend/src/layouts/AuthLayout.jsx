import React from 'react';
import { 
  Building2, ShieldCheck, CheckCircle2, 
  TrendingUp, Users, Cpu, FileSpreadsheet, Lock
} from 'lucide-react';

/**
 * Enterprise Split-Screen AuthLayout for PeoplePay360
 */
export const AuthLayout = ({ children }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        backgroundColor: '#F8FAFC',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* LEFT PANEL: Enterprise Branded Hero / Visual Information (Hidden on small tablets & mobile) */}
      <div
        className="auth-left-panel"
        style={{
          flex: '1.1',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3.5rem',
          background: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 45%, #1E293B 100%)',
          color: '#FFFFFF',
          overflow: 'hidden'
        }}
      >
        {/* Background ambient lighting */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0) 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Top: Logo & Wordmark */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.5)'
              }}
            >
              <Building2 size={24} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#FFFFFF' }}>
                PeoplePay<span style={{ color: '#60A5FA' }}>360</span>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Intelligent HR & Payroll Operations
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Value Proposition & Payroll Feature Cards */}
        <div style={{ position: 'relative', zIndex: 2, margin: '2.5rem 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.875rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              color: '#93C5FD',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}
          >
            <Cpu size={14} />
            <span>Next-Generation Workforce OS</span>
          </div>

          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
              color: '#F8FAFC'
            }}
          >
            Streamline your workforce & execute flawless payroll in minutes.
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: '#CBD5E1',
              lineHeight: 1.6,
              maxWidth: '34rem',
              marginBottom: '2rem'
            }}
          >
            Empower your HR and finance teams with sequential rule computations, real-time KYC validation, attendance proration, and instant PDF payslip distribution.
          </p>

          {/* Decorative Payroll Preview Graphic */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.5)',
              maxWidth: '36rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F1F5F9' }}>September Automated Payrun</span>
              </div>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', fontWeight: 600 }}>
                100% Disbursed
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Net Disbursed</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#38BDF8', marginTop: '0.25rem' }}>₹4,85,200</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Statutory Taxes</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#A78BFA', marginTop: '0.25rem' }}>₹58,400</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Anomaly Flags</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#34D399', marginTop: '0.25rem' }}>0 Detected</div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.75rem', color: '#CBD5E1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <CheckCircle2 size={14} color="#34D399" />
                <span>Proration Verified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <CheckCircle2 size={14} color="#34D399" />
                <span>Itemized Payslips</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <CheckCircle2 size={14} color="#34D399" />
                <span>PDF Dispatched</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Security & Trust Footer */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.8125rem',
            color: '#94A3B8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="#60A5FA" />
            <span>256-Bit Bank Grade Encryption</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={16} color="#A78BFA" />
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Form Area */}
      <div
        style={{
          flex: '0.9',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2.5rem 1.5rem',
          minHeight: '100vh',
          overflowY: 'auto'
        }}
      >
        {/* Mobile / Small Screen Header */}
        <div className="auth-mobile-header" style={{ display: 'none', width: '100%', maxWidth: '28rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Building2 size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                PeoplePay<span style={{ color: '#2563EB' }}>360</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Card Content */}
        <div
          style={{
            width: '100%',
            maxWidth: '28rem',
            margin: 'auto 0'
          }}
        >
          {children}
        </div>

        {/* Form Footer */}
        <div
          style={{
            width: '100%',
            maxWidth: '28rem',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: '#64748B',
            marginTop: '2rem'
          }}
        >
          <p>© {new Date().getFullYear()} PeoplePay360 Inc. All rights reserved.</p>
          <div style={{ marginTop: '0.375rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: '#64748B', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')} onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}>
              Privacy Policy
            </a>
            <span>•</span>
            <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: '#64748B', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')} onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}>
              Terms of Service
            </a>
            <span>•</span>
            <a href="#security" onClick={(e) => e.preventDefault()} style={{ color: '#64748B', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')} onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}>
              Security
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .auth-left-panel {
            display: none !important;
          }
          .auth-mobile-header {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
