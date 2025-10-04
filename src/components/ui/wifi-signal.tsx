import React from 'react';

interface WifiSignalProps {
  strength: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
  className?: string;
}

export function WifiSignal({ strength, className = '' }: WifiSignalProps) {
  const getSignalBars = () => {
    switch (strength) {
      case 'excellent':
        return (
          <div className="flex items-end space-x-1">
            <div className="w-1 bg-green-500 rounded-full h-3"></div>
            <div className="w-1 bg-green-500 rounded-full h-4"></div>
            <div className="w-1 bg-green-500 rounded-full h-5"></div>
          </div>
        );
      case 'good':
        return (
          <div className="flex items-end space-x-1">
            <div className="w-1 bg-yellow-500 rounded-full h-3"></div>
            <div className="w-1 bg-yellow-500 rounded-full h-4"></div>
            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
          </div>
        );
      case 'fair':
        return (
          <div className="flex items-end space-x-1">
            <div className="w-1 bg-orange-500 rounded-full h-3"></div>
            <div className="w-1 bg-gray-300 rounded-full h-4"></div>
            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
          </div>
        );
      case 'poor':
        return (
          <div className="flex items-end space-x-1">
            <div className="w-1 bg-red-500 rounded-full h-3"></div>
            <div className="w-1 bg-gray-300 rounded-full h-4"></div>
            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-end space-x-1">
            <div className="w-1 bg-gray-300 rounded-full h-3"></div>
            <div className="w-1 bg-gray-300 rounded-full h-4"></div>
            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
          </div>
        );
      default:
        return null;
    }
  };

  const getAriaLabel = () => {
    switch (strength) {
      case 'excellent':
        return 'Excellent connection';
      case 'good':
        return 'Good connection';
      case 'fair':
        return 'Fair connection';
      case 'poor':
        return 'Poor connection';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Connection status';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`} role="img" aria-label={getAriaLabel()}>
      <svg 
        className="w-4 h-4 text-gray-600" 
        fill="currentColor" 
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path 
          fillRule="evenodd" 
          d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.076 13.308-5.076 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05c-2.488-2.488-6.522-2.488-9.01 0A1 1 0 014.536 9.636c3.2-3.2 8.388-3.2 11.588 0a1 1 0 11-1.415 1.414z" 
          clipRule="evenodd" 
        />
      </svg>
      {getSignalBars()}
    </div>
  );
}
