import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const loadNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      if (res.data) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.is_read).length);
      }
    } catch (e) {
      // quiet fail if not logged in
    }
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showToast,
        notifications,
        unreadCount,
        loadNotifications,
        markRead,
        markAllRead
      }}
    >
      {children}
      {/* Toast Render Overlay */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-3 transition-all duration-300 border ${
              t.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
                : t.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/30'
                : t.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/30'
                : 'bg-slate-900/95 text-slate-100 border-slate-700'
            }`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotify must be used within NotificationProvider');
  return context;
}
