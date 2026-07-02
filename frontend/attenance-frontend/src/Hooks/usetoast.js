// useToast.js — Custom React hook for managing toast notifications
//
// 💡 Beginner tip: A "custom hook" is just a regular JavaScript function that uses 
//    React hooks (like useState) inside it. We use the "use" prefix by convention.
//    The benefit: we write the toast logic ONCE here, and reuse it in every component!

import { useState, useCallback, useMemo } from "react";

export default function useToast() {
  // 💡 toasts is an array of objects: [{ id, message, type }, ...]
  const [toasts, setToasts] = useState([]);

  // addToast: creates a new toast and adds it to the list
  // useCallback ensures the function reference doesn't change on every render
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random(); // unique id for each toast
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // removeToast: removes a toast by its id
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ✅ FIX: useMemo keeps the toast object reference STABLE across renders.
  // Without this, every render creates a new object → useCallback hooks that
  // list `toast` as a dependency think it changed → infinite re-fetch loops.
  const toast = useMemo(() => ({
    success: (msg) => addToast(msg, "success"),
    error:   (msg) => addToast(msg, "error"),
    warning: (msg) => addToast(msg, "warning"),
    info:    (msg) => addToast(msg, "info"),
  }), [addToast]);

  return { toasts, toast, removeToast };
}