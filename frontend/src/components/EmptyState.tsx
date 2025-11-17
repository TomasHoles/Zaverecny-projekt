import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../utils/iconUtils';
import '../styles/EmptyState.css';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  secondaryActionLink?: string;
  onSecondaryAction?: () => void;
  illustration?: 'transactions' | 'budgets' | 'goals' | 'analytics' | 'notifications' | 'search';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  actionLink,
  onAction,
  secondaryActionText,
  secondaryActionLink,
  onSecondaryAction,
  illustration,
}) => {
  const getIllustration = () => {
    switch (illustration) {
      case 'transactions':
        return 'money';
      case 'budgets':
        return 'target';
      case 'goals':
        return 'trophy';
      case 'analytics':
        return 'chart';
      case 'notifications':
        return 'notification';
      case 'search':
        return 'search';
      default:
        return icon || 'info';
    }
  };

  return (
    <div className="empty-state-container">
      <div className="empty-state-illustration">
        <span className="empty-state-emoji">
          <Icon name={getIllustration()} size={80} />
        </span>
        <div className="empty-state-glow"></div>
      </div>
      
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-description">{description}</p>
      
      {(actionText || secondaryActionText) && (
        <div className="empty-state-actions">
          {actionText && (
            actionLink ? (
              <Link to={actionLink} className="empty-state-action primary">
                {actionText}
              </Link>
            ) : (
              <button onClick={onAction} className="empty-state-action primary">
                {actionText}
              </button>
            )
          )}
          
          {secondaryActionText && (
            secondaryActionLink ? (
              <Link to={secondaryActionLink} className="empty-state-action secondary">
                {secondaryActionText}
              </Link>
            ) : (
              <button onClick={onSecondaryAction} className="empty-state-action secondary">
                {secondaryActionText}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
