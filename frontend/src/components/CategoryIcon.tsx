import React from 'react';
import Icon from './Icon';

interface CategoryIconProps {
  iconName: string;
  color?: string;
  size?: number;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  iconName, 
  color = 'currentColor', 
  size = 24,
  className = ''
}) => {
  // Pokud je icon ve starém formátu (emoji), zobrazíme ho jako text
  const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]|[\u2B50]|[\u3030]|[\u303D]|[\u3297]|[\u3299]/;
  if (iconName && iconName.length <= 4 && emojiRegex.test(iconName)) {
    return <span className={className} style={{ fontSize: size }}>{iconName}</span>;
  }

  // Jinak použijeme Icon komponentu
  return <Icon name={iconName} color={color} size={size} className={className} />;
};

export default CategoryIcon;
