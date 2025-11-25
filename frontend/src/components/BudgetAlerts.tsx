import React, { useEffect, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import dashboardService, { BudgetAlert } from '../services/dashboardService';
import { Icon } from '../utils/iconUtils';
import '../styles/BudgetAlerts.css';

const BudgetAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await dashboardService.getBudgetAlerts();
      setAlerts(response.alerts);
      
      // Zobraz toast notifikace pro critical alerts
      response.alerts.forEach(alert => {
        if (alert.status === 'exceeded') {
          toast.error(`Rozpočet "${alert.name}" byl překročen! (${alert.percentage.toFixed(0)}%)`);
        } else if (alert.status === 'danger') {
          toast.warning(`Rozpočet "${alert.name}" je téměř vyčerpán (${alert.percentage.toFixed(0)}%)`);
        }
      });
    } catch (error) {
      // Chyba při načítání budget alerts
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'close';
      case 'danger':
        return 'warning';
      case 'warning':
        return 'warning';
      default:
        return 'check';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return '#EF4444';
      case 'danger':
        return '#F59E0B';
      case 'warning':
        return '#FCD34D';
      default:
        return '#10B981';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'Překročeno';
      case 'danger':
        return 'Kritické';
      case 'warning':
        return 'Varování';
      default:
        return 'V pořádku';
    }
  };

  if (loading) {
    return (
      <div className="budget-alerts-card">
        <div className="budget-alerts-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return null; // Nezobrazovat komponentu, pokud nejsou žádná upozornění
  }

  return (
    <div className="budget-alerts-card">
      <div className="budget-alerts-header">
        <div className="header-title">
          <Icon name="trending-down" size={24} />
          <h3>Upozornění na rozpočty</h3>
        </div>
        <span className="alerts-count">{alerts.length}</span>
      </div>

      <div className="budget-alerts-list">
        {alerts.map((alert) => (
          <div 
            key={alert.budget_id} 
            className={`budget-alert-item ${alert.status}`}
          >
            <div className="alert-icon" style={{ color: getStatusColor(alert.status) }}>
              <Icon name={getStatusIcon(alert.status)} size={20} />
            </div>
            
            <div className="alert-content">
              <div className="alert-header">
                <h4>{alert.name}</h4>
                <span 
                  className={`alert-status ${alert.status}`}
                  style={{ backgroundColor: `${getStatusColor(alert.status)}20`, color: getStatusColor(alert.status) }}
                >
                  {getStatusText(alert.status)}
                </span>
              </div>
              
              {alert.category && (
                <p className="alert-category">Kategorie: {alert.category}</p>
              )}
              
              <div className="alert-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${Math.min(alert.percentage, 100)}%`,
                      backgroundColor: getStatusColor(alert.status)
                    }}
                  />
                </div>
                <div className="progress-info">
                  <span className="progress-percentage">{alert.percentage.toFixed(0)}%</span>
                  <span className="progress-amounts">
                    {alert.spent.toFixed(0)} / {alert.amount.toFixed(0)} CZK
                  </span>
                </div>
              </div>
              
              {alert.remaining < 0 ? (
                <p className="alert-message exceeded">
                  Překročeno o {Math.abs(alert.remaining).toFixed(0)} CZK
                </p>
              ) : (
                <p className="alert-message">
                  Zbývá {alert.remaining.toFixed(0)} CZK
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetAlerts;
