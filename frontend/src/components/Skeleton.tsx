import React from 'react';
import '../styles/Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius,
  variant = 'text',
  animation = 'pulse',
  className = '',
  style = {},
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return {
          width: width,
          height: width, // Make it square
          borderRadius: '50%',
        };
      case 'rectangular':
        return {
          width,
          height,
          borderRadius: borderRadius || '0',
        };
      case 'rounded':
        return {
          width,
          height,
          borderRadius: borderRadius || '12px',
        };
      case 'text':
      default:
        return {
          width,
          height,
          borderRadius: borderRadius || '4px',
        };
    }
  };

  return (
    <div
      className={`skeleton skeleton-${animation} ${className}`}
      style={{ ...getVariantStyles(), ...style }}
    />
  );
};

export default Skeleton;
