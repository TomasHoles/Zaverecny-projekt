/**
 * Icon.tsx - Wrapper komponenta pro SVG ikony
 * 
 * @author Tomáš Holes
 * @description Zjednodušený interface pro Icon komponentu z iconUtils.
 *              Poskytuje jednotné API pro renderování SVG ikon v aplikaci.
 * 
 * @example
 *   <Icon name="wallet" size={24} color="#ccff00" />
 * 
 * @see iconUtils.tsx - Obsahuje definice všech SVG path
 */
import React from 'react';
import { Icon as IconUtil } from '../utils/iconUtils';

interface IconProps {
  /** Název ikony (viz iconUtils.tsx pro dostupné názvy) */
  name: string;
  /** Velikost ikony v pixelech */
  size?: number;
  /** Dodatečné CSS třídy */
  className?: string;
  /** Barva ikony */
  color?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, className = '', color = 'currentColor' }) => {
  return <IconUtil name={name} size={size} className={className} color={color} />;
};

export default Icon;
