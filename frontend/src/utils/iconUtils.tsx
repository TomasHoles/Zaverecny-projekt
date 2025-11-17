import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, className = '', color = 'currentColor' }) => {
  const getIconPath = () => {
    switch (name) {
      case 'sun':
        return (
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M16.24 7.76l1.41-1.41M12 6a6 6 0 100 12 6 6 0 000-12z" />
        );
      case 'moon':
        return (
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        );
      case 'bell':
        return (
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        );
      case 'check':
        return (
          <path d="M20 6L9 17l-5-5" />
        );
      case 'check-circle':
        return (
          <>
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </>
        );
      case 'x':
        return (
          <path d="M18 6L6 18M6 6l12 12" />
        );
      case 'alert-circle':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </>
        );
      case 'alert-triangle':
        return (
          <>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        );
      case 'info':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </>
        );
      case 'lightbulb':
        return (
          <path d="M9 18h6m-3-9a3 3 0 013 3v1a2 2 0 01-2 2h-2a2 2 0 01-2-2v-1a3 3 0 013-3zm0 0V3m-3.5 15h7" />
        );
      case 'trash':
        return (
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        );
      case 'plus':
        return (
          <path d="M12 5v14M5 12h14" />
        );
      case 'trending-up':
        return (
          <path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />
        );
      case 'trending-down':
        return (
          <path d="M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6" />
        );
      case 'upload':
        return (
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        );
      case 'download':
        return (
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        );
      case 'file':
        return (
          <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zm0 0v7h7" />
        );
      case 'wallet':
        return (
          <>
            <path d="M21 12V7H5a2 2 0 01-2-2 2 2 0 012-2h14v4" />
            <path d="M3 5v14a2 2 0 002 2h16v-5" />
            <path d="M18 12a2 2 0 012 2 2 2 0 01-2 2h-6a2 2 0 01-2-2 2 2 0 012-2h6z" />
          </>
        );
      case 'target':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </>
        );
      case 'dollar-sign':
        return (
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        );
      case 'savings':
        return (
          <>
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z" />
            <path d="M2 9v1c0 1.1.9 2 2 2h1" />
            <path d="M16 11h0" />
          </>
        );
      case 'shopping-cart':
        return (
          <>
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
          </>
        );
      case 'shield':
        return (
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        );
      case 'credit-card':
        return (
          <>
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </>
        );
      case 'more-horizontal':
        return (
          <>
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </>
        );
      case 'chevron-up':
        return (
          <path d="M18 15l-6-6-6 6" />
        );
      case 'chevron-down':
        return (
          <path d="M6 9l6 6 6-6" />
        );
      case 'edit':
        return (
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        );
      case 'search':
        return (
          <>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </>
        );
      case 'filter':
        return (
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
        );
      case 'calendar':
        return (
          <>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </>
        );
      case 'arrow-up':
        return (
          <path d="M12 19V5M5 12l7-7 7 7" />
        );
      case 'arrow-down':
        return (
          <path d="M12 5v14M19 12l-7 7-7-7" />
        );
      case 'home':
        return (
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />
        );
      case 'bar-chart':
        return (
          <path d="M12 20V10M18 20V4M6 20v-4" />
        );
      case 'pie-chart':
        return (
          <>
            <path d="M21.21 15.89A10 10 0 118 2.83" />
            <path d="M22 12A10 10 0 0012 2v10z" />
          </>
        );
      case 'eye':
        return (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        );
      case 'eye-off':
        return (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        );
      case 'health':
        return (
          <>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </>
        );
      case 'gift':
        return (
          <>
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect x="2" y="7" width="20" height="5" />
            <line x1="12" y1="22" x2="12" y2="7" />
            <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
          </>
        );
      case 'income':
        return (
          <>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            <polyline points="8 5 12 1 16 5" />
          </>
        );
      case 'expense':
        return (
          <>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            <polyline points="16 19 12 23 8 19" />
          </>
        );
      case 'balance':
        return (
          <>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </>
        );
      case 'piggy-bank':
        return (
          <>
            <path d="M19 6c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V21h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V6z" />
            <circle cx="16" cy="11" r="1" />
          </>
        );
      case 'money':
        return (
          <>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </>
        );
      case 'chart':
        return (
          <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
        );
      case 'trophy':
        return (
          <>
            <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0012 0V2z" />
          </>
        );
      case 'notification':
        return (
          <>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </>
        );
      default:
        return (
          <circle cx="12" cy="12" r="10" />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {getIconPath()}
    </svg>
  );
};

export default Icon;
