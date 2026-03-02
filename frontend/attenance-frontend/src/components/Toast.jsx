// Toast.jsx — Reusable toast notification component
// 💡 Beginner tip: This is a "presentational component" — it only handles HOW things look,
//    not what data to show. The logic lives in useToast.js

import React, { useEffect } from "react";
import "./Toast.css";

/**
 * Toast component
 * Props:
 *  - toasts: array of { id, message, type } — type can be 'success' | 'error' | 'info' | 'warning'
 *  - removeToast: function to remove a toast by id
 */
export default function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, removeToast }) {
  // 💡 Beginner tip: useEffect runs side-effects. Here we auto-dismiss the toast after 3.5 seconds.
  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), 3500);
    return () => clearTimeout(timer); // cleanup — prevents memory leaks
  }, [toast.id, removeToast]);

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      <span className="toast-icon">{icons[toast.type] || "ℹ️"}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
    </div>
  );
}