import React from 'react';
import Icon from './Icon';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: number;
  changeLabel?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  prefix?: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  changeLabel,
  color = '#3b82f6',
  trend = 'neutral',
  prefix = '',
  suffix = ''
}) => {
  const getTrendColor = () => {
    if (trend === 'up') return '#10b981';
    if (trend === 'down') return '#ef4444';
    return '#6b7280';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'minus';
  };

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ backgroundColor: `${color}15`, color }}>
          <Icon name={icon} size={24} />
        </div>
        {change !== undefined && change !== null && !isNaN(change) && (
          <div className="stat-card-change" style={{ color: getTrendColor() }}>
            <Icon name={getTrendIcon()} size={16} />
            <span>{change > 0 ? '+' : ''}{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <p className="stat-card-value">
          {prefix}{typeof value === 'number' ? value.toLocaleString('cs-CZ') : value}{suffix}
        </p>
        {changeLabel && (
          <p className="stat-card-label">{changeLabel}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
