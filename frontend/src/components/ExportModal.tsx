import React, { useState } from 'react';
import Icon from './Icon';
import '../styles/ExportModal.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'transactions' | 'budgets' | 'analytics';
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, exportType }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      let url = '';
      const params = new URLSearchParams();
      
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      switch (exportType) {
        case 'transactions':
          url = `/transactions/transactions/export_${format}/?${params}`;
          break;
        case 'budgets':
          url = `/budgets/budgets/export_${format}/?${params}`;
          break;
        case 'analytics':
          url = `/transactions/transactions/export_${format}/?${params}`;
          break;
      }
      
      // Použijeme window.location pro download souboru
      const token = localStorage.getItem('token');
      const fullUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}${url}`;
      
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Získat název souboru z Content-Disposition headeru
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `export_${new Date().toISOString().split('T')[0]}.${format}`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        // Zavřít modal po úspěšném stažení
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        alert('Chyba při exportu dat');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Chyba při exportu dat');
    } finally {
      setExporting(false);
    }
  };

  const getTitle = () => {
    switch (exportType) {
      case 'transactions':
        return 'Export transakcí';
      case 'budgets':
        return 'Export rozpočtů';
      case 'analytics':
        return 'Export analytiky';
      default:
        return 'Export dat';
    }
  };

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);
    
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2 className="export-modal-title">
            <Icon name="wallet" size={24} />
            {getTitle()}
          </h2>
          <button className="export-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="export-modal-content">
          <div className="export-section">
            <h3>Časové období</h3>
            <div className="quick-dates">
              <button onClick={() => setQuickDateRange(7)}>Poslední týden</button>
              <button onClick={() => setQuickDateRange(30)}>Poslední měsíc</button>
              <button onClick={() => setQuickDateRange(90)}>Poslední 3 měsíce</button>
              <button onClick={() => setQuickDateRange(365)}>Poslední rok</button>
            </div>
            <div className="date-inputs">
              <div className="form-group">
                <label>Od:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Do:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="export-section">
            <h3>Formát souboru</h3>
            <div className="format-options">
              <button
                className={`format-btn ${format === 'csv' ? 'active' : ''}`}
                onClick={() => setFormat('csv')}
              >
                <Icon name="chart" size={20} />
                <span>CSV</span>
                <p>Pro Excel a Google Sheets</p>
              </button>
              <button
                className={`format-btn ${format === 'json' ? 'active' : ''}`}
                onClick={() => setFormat('json')}
              >
                <Icon name="analytics" size={20} />
                <span>JSON</span>
                <p>Pro programové zpracování</p>
              </button>
            </div>
          </div>
        </div>

        <div className="export-modal-footer">
          <button className="btn-cancel-export" onClick={onClose}>
            Zrušit
          </button>
          <button
            className="btn-export"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <div className="spinner-small"></div>
                Exportuji...
              </>
            ) : (
              <>
                <Icon name="wallet" size={20} />
                Stáhnout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
