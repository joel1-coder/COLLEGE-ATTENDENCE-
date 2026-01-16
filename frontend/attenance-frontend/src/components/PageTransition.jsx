import React, { useEffect, useState } from 'react';
import './PageTransition.css';

export default function PageTransition({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // trigger enter after mount so CSS transition runs
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`page-transition ${mounted ? 'enter' : ''}`}>
      {children}
    </div>
  );
}
