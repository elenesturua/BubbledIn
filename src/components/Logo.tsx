import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = '', width, height }: LogoProps) {
  const [logoSrc, setLogoSrc] = useState('/logo.png');
  const [hasError, setHasError] = useState(false);
  
  const handleImageError = () => {
    setHasError(true);
  };

  // Fallback SVG icon
  const FallbackIcon = () => (
    <div
      className={`bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center ${className}`}
      style={{ width: width || 64, height: height || 64 }}
    >
      <svg
        className="text-white"
        fill="currentColor"
        viewBox="0 0 24 24"
        width="60%"
        height="60%"
      >
        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 10v-2h-2.5c-.83 0-1.5-.67-1.2-1.35l1.15-4.66L15.2 5.3c-.25-.99-.36-1.5-.48-2.11-.99-.84-2.98-.84-3.97 0-.12.61-.23 1.12-.48 2.11l-2.65 5.69C7.5 11.33 7 12 7 12h-3v4h8v6h3v-6h2z" />
      </svg>
    </div>
  );

  if (hasError) {
    return <FallbackIcon />;
  }
  
  const wrapperStyle: React.CSSProperties = {};
  if (width) wrapperStyle.width = width;
  if (height) wrapperStyle.height = height;

  return (
    <div className={`relative ${className}`} style={wrapperStyle}>
      <img
        src={logoSrc}
        alt="BubbledIn Logo"
        className="w-full object-contain"
        width={width}
        height={height}
        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
        onError={handleImageError}
      />
    </div>
  );
}

export default Logo;
