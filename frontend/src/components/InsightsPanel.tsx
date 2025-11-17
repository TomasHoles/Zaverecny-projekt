import React, { useState, useEffect } from 'react';
import dashboardService, { FinancialInsight } from '../services/dashboardService';
import { Icon } from '../utils/iconUtils';
import '../styles/InsightsPanel.css';

interface InsightsPanelProps {
  timeRange?: string;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ timeRange = '1m' }) => {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [timeRange]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getFinancialInsights(timeRange);
      setInsights(data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string, severity: string) => {
    if (severity === 'critical') return 'close';
    if (severity === 'warning') return 'warning';
    
    switch (type) {
      case 'overspending':
        return 'money';
      case 'savings_opportunity':
        return 'money';
      case 'unusual_spending':
        return 'chart';
      case 'budget_alert':
        return 'target';
      case 'trend_analysis':
        return 'trending-up';
      case 'recommendation':
        return 'lightbulb';
      default:
        return 'info';
    }
  };

  const getInsightColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      case 'success':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getActionButton = (insight: FinancialInsight) => {
    if (insight.action_url) {
      return (
        <a href={insight.action_url} className="insight-action-btn">
          {insight.action_text || 'Zobrazit detail'}
        </a>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="insights-panel">
        <div className="insights-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="insights-panel">
        <div className="insights-empty">
          <span className="empty-icon">
            <Icon name="lightbulb" size={48} />
          </span>
          <p>Zatím žádné doporučení</p>
          <small>Přidejte více transakcí pro personalizovaná doporučení</small>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <div className="header-title">
          <Icon name="trending-up" size={24} />
          <h3>Insights</h3>
        </div>
        <span className="insights-count">{insights.length}</span>
      </div>

      <div className="insights-list">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={`insight-card ${insight.severity} ${expandedInsight === index ? 'expanded' : ''}`}
            style={{ borderLeftColor: getInsightColor(insight.severity) }}
          >
            <div 
              className="insight-header"
              onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
            >
              <div className="insight-icon">
                <Icon name={getInsightIcon(insight.type, insight.severity)} size={24} />
              </div>
              
              <div className="insight-content">
                <h4>{insight.title}</h4>
                <p className="insight-message">{insight.message}</p>
              </div>

              <button className="insight-expand">
                <Icon name={expandedInsight === index ? 'chevron-up' : 'chevron-down'} size={20} />
              </button>
            </div>

            {expandedInsight === index && (
              <div className="insight-details">
                {insight.details && (
                  <div className="insight-detail-text">
                    {insight.details}
                  </div>
                )}
                
                {insight.data && (
                  <div className="insight-data">
                    {Object.entries(insight.data).map(([key, value]) => (
                      <div key={key} className="data-item">
                        <span className="data-label">{key}:</span>
                        <span className="data-value">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {getActionButton(insight)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsPanel;
