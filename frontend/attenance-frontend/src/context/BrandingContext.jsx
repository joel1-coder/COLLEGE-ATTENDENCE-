import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const BrandingContext = createContext();

const STORAGE_KEY = "lab_branding";

const DEFAULTS = {
  collegeName: "LAB Attendance",
  logoDataUrl: null,          // base64 or null → falls back to favicon.jpg
  primaryColor: "#1E3A8A",
  secondaryColor: "#F59E0B",
};

export function BrandingProvider({ children }) {
  const [branding, setBrandingState] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return stored ? { ...DEFAULTS, ...stored } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  });

  // Apply CSS custom properties to :root whenever branding changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", branding.primaryColor);
    root.style.setProperty("--brand-secondary", branding.secondaryColor);
    // Also set the page <title>
    document.title = branding.collegeName;
  }, [branding]);

  const setBranding = useCallback((updates) => {
    setBrandingState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetBranding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setBrandingState({ ...DEFAULTS });
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, setBranding, resetBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
