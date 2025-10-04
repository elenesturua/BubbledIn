"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    // Detect system theme preference and respect dark mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = mediaQuery.matches || document.documentElement.classList.contains('dark');
    
    const handleChange = () => {
      const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches || 
                         document.documentElement.classList.contains('dark');
      setTheme(isDarkMode ? "dark" : "light");
    };

    // Initial check
    handleChange();

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);
    
    // Also listen for manual dark mode class changes
    const observer = new MutationObserver(handleChange);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      observer.disconnect();
    };
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
