import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, className = '', color = 'currentColor' }) => {
  const icons: { [key: string]: React.ReactElement } = {
    // Finance ikony
    'income': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'expense': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12h13l-4-4m4 4l-4 4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'balance': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="9 10 12 13 22 3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'chart': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <line x1="12" y1="20" x2="12" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="18" y1="20" x2="18" y2="4" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="6" y1="20" x2="6" y2="16" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'trending-up': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'target': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'user': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'plus': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'trash': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'analytics': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 12A10 10 0 0 0 12 2v10z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'lightbulb': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M9 18h6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 22h4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'gem': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <polygon points="12 2 2 7 12 22 22 7 12 2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="12 22 12 7" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="2 7 7.5 2 16.5 2 22 7" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="7.5 2 7.5 7 16.5 7 16.5 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    // Kategorie výdajů
    'food': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'transport': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M5 17h-2v-5l2-3h12l2 3v5h-2m-4 0a2 2 0 1 1-4 0m4 0h2m-6 0H5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 9l1.5-4.5h11L19 9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'home': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'entertainment': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="17 2 12 7 7 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'clothing': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'health': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'education': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'wallet': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 12a2 2 0 0 0 0 4h4v-4z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'gift': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <polyline points="20 12 20 22 4 22 4 12" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="7" width="20" height="5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="22" x2="12" y2="7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'bell': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  };

  return icons[name] || <span>?</span>;
};

export default Icon;
