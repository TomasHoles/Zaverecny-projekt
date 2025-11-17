import React from 'react';
import Icon from './Icon';
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
  return (
    <div className="page-header">
      <div className="page-header-content">
        <div className="page-header-info">
          {icon && (
            <div className="page-header-icon">
              <Icon name={icon} size={32} />
            </div>
          )}
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
            {helpText && (
              <div className="page-help-text">
                <Icon name="info" size={14} />
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
