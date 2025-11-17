import React from 'react';
import { Icon as IconUtil } from '../utils/iconUtils';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, className = '', color = 'currentColor' }) => {
  return <IconUtil name={name} size={size} className={className} color={color} />;
};

export default Icon;
