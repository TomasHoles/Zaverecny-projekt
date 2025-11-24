import React from 'react';
import { Info, LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import '../styles/PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
  helpText?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  helpText
}) => {
  // Dynamicky získat ikonu z lucide-react
  const getIconComponent = (iconName: string) => {
    const formattedName = iconName.split('-').map((word, index) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');

    const IconComponent = (LucideIcons as any)[formattedName] as LucideIcon;
    return IconComponent ? <IconComponent size={32} /> : null;
  };

  return (
    <div className="page-header">
      <div className="page-header-content">
        <div className="page-header-info">
          {icon && (
            <div className="page-header-icon">
              {getIconComponent(icon)}
            </div>
          )}
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
            {helpText && (
              <div className="page-help-text">
                <Info size={14} />
                <span>{helpText}</span>
              </div>
            )}
          </div>
        </div>
        {action && (
          <div className="page-header-action">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
